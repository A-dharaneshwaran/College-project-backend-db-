import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

const RECENT_SEARCHES_KEY = '@kce_recent_searches';
const MAX_RECENT = 10;
const DEBOUNCE_MS = 350;
const SUGGESTION_DEBOUNCE_MS = 200;

// ─── Highlight component — bolds matched substring ──────────────────────────
const HighlightText = ({ text = '', highlight = '', style, highlightStyle }) => {
    if (!highlight.trim() || !text) return <Text style={style}>{text}</Text>;

    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

    return (
        <Text style={style}>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <Text key={i} style={[style, highlightStyle || styles.highlight]}>
                        {part}
                    </Text>
                ) : (
                    <Text key={i}>{part}</Text>
                )
            )}
        </Text>
    );
};

// ─── Skeleton card ───────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '40%', marginTop: 6 }]} />
        </View>
    </View>
);

// ─── Entity icon helper ──────────────────────────────────────────────────────
const entityMeta = {
    students: { icon: 'graduation-cap', color: '#1565C0', bg: '#E3F2FD', label: 'Students' },
    faculty: { icon: 'user-tie', color: '#2E7D32', bg: '#E8F5E9', label: 'Faculty' },
    departments: { icon: 'building', color: '#E65100', bg: '#FFF3E0', label: 'Departments' },
    subjects: { icon: 'book', color: '#6A1B9A', bg: '#F3E5F5', label: 'Subjects' },
    activities: { icon: 'history', color: '#37474F', bg: '#ECEFF1', label: 'Activity Logs' },
};

export default function GlobalSearch() {
    const router = useRouter();
    const searchInputRef = useRef(null);

    const [searchText, setSearchText] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const debounceRef = useRef(null);
    const suggestionDebounceRef = useRef(null);
    const abortRef = useRef(null);
    const suggestionAbortRef = useRef(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        loadRecentSearches();

        // Keyboard shortcut for web: Ctrl+K or "/"
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const handleKeyDown = (e) => {
                // Don't intercept when focus is in an input/textarea
                const tag = document.activeElement?.tagName?.toLowerCase();
                if (tag === 'input' || tag === 'textarea') return;

                if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
                    e.preventDefault();
                    searchInputRef.current?.focus();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                isMounted.current = false;
                window.removeEventListener('keydown', handleKeyDown);
            };
        }

        return () => { isMounted.current = false; };
    }, []);

    // ── Recent searches ──────────────────────────────────────────────────────

    const loadRecentSearches = async () => {
        try {
            const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            if (raw) setRecentSearches(JSON.parse(raw));
        } catch (_) { /* ignore */ }
    };

    const saveRecentSearch = async (q) => {
        if (!q || !q.trim()) return;
        const trimmed = q.trim();
        try {
            const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
            setRecentSearches(updated);
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (_) { /* ignore */ }
    };

    const clearRecentSearches = async () => {
        try {
            await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
            setRecentSearches([]);
        } catch (_) { /* ignore */ }
    };

    // ── Search suggestions (fast — 200ms debounce) ───────────────────────────

    const fetchSuggestions = useCallback(async (q) => {
        if (!q || q.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        if (suggestionAbortRef.current) suggestionAbortRef.current.abort();
        suggestionAbortRef.current = new AbortController();

        try {
            const res = await api.get(`/search/suggestions?q=${encodeURIComponent(q.trim())}&limit=8`);
            if (!isMounted.current) return;
            setSuggestions(res.data || []);
            setShowSuggestions(true);
        } catch (_) { /* ignore — suggestions are best-effort */ }
    }, []);

    // ── Main search (350ms debounce) ──────────────────────────────────────────

    const performSearch = useCallback(async (q) => {
        if (!q || !q.trim()) {
            setResults(null);
            setLoading(false);
            return;
        }

        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        setLoading(true);
        setError(null);
        setShowSuggestions(false);

        try {
            const res = await api.get(`/search/global?q=${encodeURIComponent(q.trim())}&limit=5`);
            if (!isMounted.current) return;
            setResults(res.data || {});
            await saveRecentSearch(q.trim());
        } catch (err) {
            if (!isMounted.current) return;
            if (err.name === 'AbortError' || err.message === 'AbortError') return;
            setError(err.message || 'Search failed. Please try again.');
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [recentSearches]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Wire up debounces ─────────────────────────────────────────────────────

    useEffect(() => {
        // Suggestion debounce (faster)
        if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);
        suggestionDebounceRef.current = setTimeout(() => {
            fetchSuggestions(searchText);
        }, SUGGESTION_DEBOUNCE_MS);

        // Main search debounce
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedQuery(searchText);
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);
        };
    }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        performSearch(debouncedQuery);
    }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Navigation ─────────────────────────────────────────────────────────

    const navigateTo = (entityType, item) => {
        switch (entityType) {
            case 'students':
                router.push('/admin/manage-students');
                break;
            case 'faculty':
                router.push('/admin/manage-faculty');
                break;
            case 'departments':
                router.push('/admin/departments');
                break;
            case 'subjects':
                router.push('/admin/departments');
                break;
            case 'activities':
                router.push('/admin/activity-history');
                break;
            default:
                break;
        }
    };

    const viewAll = (entityType) => {
        switch (entityType) {
            case 'students': router.push('/admin/manage-students'); break;
            case 'faculty': router.push('/admin/manage-faculty'); break;
            case 'departments': router.push('/admin/departments'); break;
            case 'activities': router.push('/admin/activity-history'); break;
            default: break;
        }
    };

    // ── Result renderers ──────────────────────────────────────────────────────

    const renderStudentItem = (item, index) => (
        <Animated.View key={item._id} entering={FadeInDown.delay(index * 40)}>
            <TouchableOpacity style={styles.resultCard} onPress={() => navigateTo('students', item)} activeOpacity={0.75}>
                <View style={[styles.resultAvatar, { backgroundColor: entityMeta.students.bg }]}>
                    <FontAwesome name="graduation-cap" size={16} color={entityMeta.students.color} />
                </View>
                <View style={styles.resultInfo}>
                    <HighlightText
                        text={item.user?.name || 'Unknown'}
                        highlight={searchText}
                        style={styles.resultName}
                    />
                    <HighlightText
                        text={`${item.registerNumber || ''} · ${item.department?.name || ''}`}
                        highlight={searchText}
                        style={styles.resultSub}
                    />
                </View>
                <View style={[styles.badge, { backgroundColor: entityMeta.students.bg }]}>
                    <Text style={[styles.badgeText, { color: entityMeta.students.color }]}>Y{item.year}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderFacultyItem = (item, index) => (
        <Animated.View key={item._id} entering={FadeInDown.delay(index * 40)}>
            <TouchableOpacity style={styles.resultCard} onPress={() => navigateTo('faculty', item)} activeOpacity={0.75}>
                <View style={[styles.resultAvatar, { backgroundColor: entityMeta.faculty.bg }]}>
                    <FontAwesome name="user-circle" size={16} color={entityMeta.faculty.color} />
                </View>
                <View style={styles.resultInfo}>
                    <HighlightText
                        text={item.user?.name || 'Unknown'}
                        highlight={searchText}
                        style={styles.resultName}
                    />
                    <HighlightText
                        text={`${item.employeeId || ''} · ${item.designation || ''}`}
                        highlight={searchText}
                        style={styles.resultSub}
                    />
                </View>
                <View style={[styles.badge, { backgroundColor: entityMeta.faculty.bg }]}>
                    <Text style={[styles.badgeText, { color: entityMeta.faculty.color }]} numberOfLines={1}>
                        {item.department?.code || ''}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderDepartmentItem = (item, index) => (
        <Animated.View key={item._id} entering={FadeInDown.delay(index * 40)}>
            <TouchableOpacity style={styles.resultCard} onPress={() => navigateTo('departments', item)} activeOpacity={0.75}>
                <View style={[styles.resultAvatar, { backgroundColor: entityMeta.departments.bg }]}>
                    <FontAwesome name="building" size={16} color={entityMeta.departments.color} />
                </View>
                <View style={styles.resultInfo}>
                    <HighlightText text={item.name} highlight={searchText} style={styles.resultName} />
                    <HighlightText
                        text={`Code: ${item.code || ''}`}
                        highlight={searchText}
                        style={styles.resultSub}
                    />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderSubjectItem = (item, index) => (
        <Animated.View key={item._id} entering={FadeInDown.delay(index * 40)}>
            <TouchableOpacity style={styles.resultCard} onPress={() => navigateTo('subjects', item)} activeOpacity={0.75}>
                <View style={[styles.resultAvatar, { backgroundColor: entityMeta.subjects.bg }]}>
                    <FontAwesome name="book" size={16} color={entityMeta.subjects.color} />
                </View>
                <View style={styles.resultInfo}>
                    <HighlightText text={item.name} highlight={searchText} style={styles.resultName} />
                    <HighlightText
                        text={`${item.code || ''} · Sem ${item.semester || ''}`}
                        highlight={searchText}
                        style={styles.resultSub}
                    />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderActivityItem = (item, index) => (
        <Animated.View key={item._id} entering={FadeInDown.delay(index * 40)}>
            <TouchableOpacity style={styles.resultCard} onPress={() => navigateTo('activities', item)} activeOpacity={0.75}>
                <View style={[styles.resultAvatar, { backgroundColor: entityMeta.activities.bg }]}>
                    <FontAwesome name="history" size={16} color={entityMeta.activities.color} />
                </View>
                <View style={styles.resultInfo}>
                    <HighlightText text={item.action || 'Activity'} highlight={searchText} style={styles.resultName} />
                    <HighlightText text={item.description || ''} highlight={searchText} style={styles.resultSub} numberOfLines={1} />
                </View>
                <View style={[styles.badge, { backgroundColor: entityMeta.activities.bg }]}>
                    <Text style={[styles.badgeText, { color: entityMeta.activities.color }]} numberOfLines={1}>
                        {item.module || ''}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderGroupSection = (entityType, items, renderItem) => {
        if (!items || items.length === 0) return null;
        const meta = entityMeta[entityType];
        return (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.groupSection}>
                <View style={styles.groupHeader}>
                    <View style={[styles.groupIconWrap, { backgroundColor: meta.bg }]}>
                        <FontAwesome name={meta.icon} size={14} color={meta.color} />
                    </View>
                    <Text style={[styles.groupLabel, { color: meta.color }]}>{meta.label}</Text>
                    <View style={styles.groupCount}>
                        <Text style={styles.groupCountText}>{items.length}</Text>
                    </View>
                    <TouchableOpacity style={styles.viewAllBtn} onPress={() => viewAll(entityType)}>
                        <Text style={styles.viewAllText}>View All</Text>
                        <Ionicons name="chevron-forward" size={12} color="#C62828" />
                    </TouchableOpacity>
                </View>
                {items.map((item, index) => renderItem(item, index))}
            </Animated.View>
        );
    };

    const hasResults = results && (
        (results.students?.length || 0) +
        (results.faculty?.length || 0) +
        (results.departments?.length || 0) +
        (results.subjects?.length || 0) +
        (results.activities?.length || 0)
    ) > 0;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={['#C62828', '#B71C1C']} style={styles.header}>
                <View style={styles.searchBarWrapper}>
                    <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder={Platform.OS === 'web' ? 'Search anything... (Ctrl+K)' : 'Search students, faculty, departments...'}
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={(text) => {
                            setSearchText(text);
                            if (!text.trim()) {
                                setResults(null);
                                setError(null);
                                setSuggestions([]);
                                setShowSuggestions(false);
                            }
                        }}
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                        onBlur={() => {
                            setTimeout(() => setShowSuggestions(false), 150);
                        }}
                        returnKeyType="search"
                        onSubmitEditing={() => performSearch(searchText)}
                        autoFocus
                        id="global-search-input"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {loading && <ActivityIndicator size="small" color="#C62828" style={{ marginRight: 8 }} />}
                    {searchText.length > 0 && !loading && (
                        <TouchableOpacity
                            onPress={() => {
                                setSearchText('');
                                setResults(null);
                                setError(null);
                                setSuggestions([]);
                                setShowSuggestions(false);
                            }}
                            style={styles.clearBtn}
                        >
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Keyboard shortcut hint for web */}
                {Platform.OS === 'web' && (
                    <View style={styles.shortcutHint}>
                        <Text style={styles.shortcutText}>Press </Text>
                        <View style={styles.keyBadge}><Text style={styles.keyText}>Ctrl</Text></View>
                        <Text style={styles.shortcutText}> + </Text>
                        <View style={styles.keyBadge}><Text style={styles.keyText}>K</Text></View>
                        <Text style={styles.shortcutText}> or </Text>
                        <View style={styles.keyBadge}><Text style={styles.keyText}>/</Text></View>
                        <Text style={styles.shortcutText}> to focus</Text>
                    </View>
                )}
            </LinearGradient>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <Animated.View entering={FadeIn.duration(150)} style={styles.suggestionsDropdown}>
                    {suggestions.map((s, i) => (
                        <TouchableOpacity
                            key={`${s.text}-${i}`}
                            style={styles.suggestionItem}
                            onPress={() => {
                                setSearchText(s.text);
                                setShowSuggestions(false);
                            }}
                        >
                            <Ionicons
                                name={
                                    s.type === 'student' ? 'school-outline' :
                                    s.type === 'faculty' ? 'person-outline' :
                                    s.type === 'department' ? 'business-outline' :
                                    'book-outline'
                                }
                                size={14}
                                color="#666"
                                style={{ marginRight: 8 }}
                            />
                            <HighlightText text={s.text} highlight={searchText} style={styles.suggestionText} />
                            {s.subtitle && (
                                <Text style={styles.suggestionSub}> · {s.subtitle}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            )}

            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Idle state — show recent searches */}
                {!searchText && !loading && !results && (
                    <Animated.View entering={FadeIn.duration(300)}>
                        {recentSearches.length > 0 && (
                            <View style={styles.recentSection}>
                                <View style={styles.recentHeader}>
                                    <Text style={styles.recentTitle}>Recent Searches</Text>
                                    <TouchableOpacity onPress={clearRecentSearches}>
                                        <Text style={styles.clearRecentText}>Clear All</Text>
                                    </TouchableOpacity>
                                </View>
                                {recentSearches.map((q, i) => (
                                    <TouchableOpacity
                                        key={`recent-${i}`}
                                        style={styles.recentItem}
                                        onPress={() => setSearchText(q)}
                                    >
                                        <Ionicons name="time-outline" size={16} color="#999" style={{ marginRight: 10 }} />
                                        <Text style={styles.recentText}>{q}</Text>
                                        <TouchableOpacity
                                            onPress={async () => {
                                                const updated = recentSearches.filter((_, idx) => idx !== i);
                                                setRecentSearches(updated);
                                                await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
                                            }}
                                            style={{ padding: 4 }}
                                        >
                                            <Ionicons name="close" size={14} color="#ccc" />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Search hints */}
                        <View style={styles.hintSection}>
                            <Text style={styles.hintTitle}>Search across</Text>
                            {Object.values(entityMeta).map((meta) => (
                                <View key={meta.label} style={styles.hintRow}>
                                    <View style={[styles.hintIconWrap, { backgroundColor: meta.bg }]}>
                                        <FontAwesome name={meta.icon} size={14} color={meta.color} />
                                    </View>
                                    <Text style={styles.hintText}>{meta.label}</Text>
                                </View>
                            ))}
                            {Platform.OS === 'web' && (
                                <View style={styles.shortcutHintBody}>
                                    <Text style={styles.shortcutBodyText}>
                                        Tip: Press <Text style={styles.shortcutBodyKey}>Ctrl+K</Text> or{' '}
                                        <Text style={styles.shortcutBodyKey}>/</Text> from anywhere to open search
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                )}

                {/* Loading skeletons */}
                {loading && (
                    <Animated.View entering={FadeIn.duration(200)}>
                        {[...Array(3)].map((_, i) => (
                            <View key={i} style={styles.groupSection}>
                                <View style={styles.skeletonGroupHeader} />
                                {[...Array(2)].map((__, j) => <SkeletonCard key={j} />)}
                            </View>
                        ))}
                    </Animated.View>
                )}

                {/* Error state */}
                {error && !loading && (
                    <Animated.View entering={FadeInDown.duration(300)} style={styles.stateContainer}>
                        <View style={styles.stateIconWrap}>
                            <Ionicons name="wifi-outline" size={40} color="#EF5350" />
                        </View>
                        <Text style={styles.stateTitle}>Search Failed</Text>
                        <Text style={styles.stateSubtitle}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => performSearch(searchText)}
                        >
                            <Ionicons name="refresh" size={16} color="#fff" />
                            <Text style={styles.retryBtnText}>Retry</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* No results */}
                {!loading && !error && results && !hasResults && searchText.trim() && (
                    <Animated.View entering={FadeInDown.duration(300)} style={styles.stateContainer}>
                        <View style={styles.stateIconWrap}>
                            <Ionicons name="search-outline" size={40} color="#9E9E9E" />
                        </View>
                        <Text style={styles.stateTitle}>No Results Found</Text>
                        <Text style={styles.stateSubtitle}>
                            No matches for "{searchText}". Try a different name, register number, or employee ID.
                        </Text>
                    </Animated.View>
                )}

                {/* Results */}
                {!loading && !error && hasResults && (
                    <View>
                        {renderGroupSection('students', results.students, renderStudentItem)}
                        {renderGroupSection('faculty', results.faculty, renderFacultyItem)}
                        {renderGroupSection('departments', results.departments, renderDepartmentItem)}
                        {renderGroupSection('subjects', results.subjects, renderSubjectItem)}
                        {renderGroupSection('activities', results.activities, renderActivityItem)}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 12,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    searchBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        minHeight: 46,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1a1a1a',
        paddingVertical: 10,
        outlineStyle: 'none',
    },
    clearBtn: {
        padding: 4,
    },
    shortcutHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    shortcutText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
    },
    keyBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    keyText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },

    // Suggestions
    suggestionsDropdown: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 115 : (StatusBar.currentHeight || 0) + 75,
        left: 16,
        right: 16,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 999,
        overflow: 'hidden',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    suggestionText: {
        fontSize: 14,
        color: '#222',
        flex: 1,
    },
    suggestionSub: {
        fontSize: 12,
        color: '#999',
    },

    body: { flex: 1 },
    bodyContent: { padding: 16, paddingBottom: 40 },

    // Recent searches
    recentSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recentTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
    },
    clearRecentText: {
        fontSize: 12,
        color: '#C62828',
        fontWeight: '600',
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    recentText: {
        flex: 1,
        fontSize: 14,
        color: '#444',
    },

    // Hints
    hintSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    hintTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#999',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    hintIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    hintText: {
        fontSize: 14,
        color: '#444',
        fontWeight: '500',
    },
    shortcutHintBody: {
        marginTop: 12,
        padding: 10,
        backgroundColor: '#FFF8E1',
        borderRadius: 8,
    },
    shortcutBodyText: {
        fontSize: 12,
        color: '#6D4C41',
    },
    shortcutBodyKey: {
        fontWeight: '700',
        color: '#C62828',
    },

    // Group sections
    groupSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 2,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    groupIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    groupLabel: {
        fontSize: 13,
        fontWeight: '700',
        flex: 1,
    },
    groupCount: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
        marginRight: 8,
    },
    groupCountText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '600',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        fontSize: 12,
        color: '#C62828',
        fontWeight: '600',
    },

    // Result cards
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: '#FAFAFA',
    },
    resultAvatar: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    resultInfo: { flex: 1 },
    resultName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    resultSub: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    badge: {
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
        maxWidth: 70,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    highlight: {
        fontWeight: '700',
        backgroundColor: '#FFF176',
        borderRadius: 2,
    },

    // Skeleton
    skeletonGroupHeader: {
        height: 44,
        backgroundColor: '#F0F0F0',
        margin: 12,
        borderRadius: 6,
    },
    skeletonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    skeletonAvatar: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#EEEEEE',
        marginRight: 12,
    },
    skeletonLines: { flex: 1 },
    skeletonLine: {
        height: 12,
        backgroundColor: '#EEEEEE',
        borderRadius: 6,
    },

    // States
    stateContainer: {
        alignItems: 'center',
        paddingVertical: 50,
        paddingHorizontal: 32,
    },
    stateIconWrap: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    stateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    stateSubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#C62828',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        gap: 8,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});

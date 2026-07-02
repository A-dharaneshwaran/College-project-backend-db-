import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Modal, 
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { copyToClipboard } from '../../utils/clipboard';
import { sendEmail, makeCall } from '../../utils/linking';

export default function ContactDirectory() {
  const router = useRouter();
  const { user } = useAuth();

  // State Management
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);

  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Profile Modal State
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Fetch Departments on Mount
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments');
        if (res.success) {
          setDepartments(res.data);
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    fetchDepts();
  }, []);

  // Debounce Search input (300ms)
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search query
    }, 300);
    return () => clearTimeout(delayTimer);
  }, [search]);

  // Fetch Contacts on filter/page updates
  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = [
        `page=${page}`,
        `limit=20`,
        `search=${encodeURIComponent(debouncedSearch)}`,
        `role=${role}`,
        `department=${department}`,
        `sortBy=${sortBy}`
      ].join('&');

      const res = await api.get(`/contacts?${queryParams}`);
      if (res.success) {
        setContacts(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      } else {
        throw new Error('API reported failure');
      }
    } catch (err) {
      console.error(err);
      setError('Network communication failed. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [debouncedSearch, role, department, sortBy, page]);

  // Clear Filters Handler
  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setRole('');
    setDepartment('');
    setSortBy('name');
    setPage(1);
  };

  // Start Chat Handler
  const handleStartChat = async (targetUser) => {
    setSelectedProfile(null); // close details modal if open
    try {
      const res = await api.post('/messages/conversations', {
        type: 'direct',
        participants: [targetUser.userId]
      });
      if (res.success) {
        router.push({
          pathname: `/${user.role}/messages`,
          params: { conversationId: res.data._id }
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to start chat session');
    }
  };

  // Render Single Contact Card
  const renderContactCard = ({ item }) => {
    const initials = item.name ? item.name.substring(0, 2).toUpperCase() : 'U';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.nameText}>{item.name}</Text>
            <View style={[styles.badge, styles[`badge_${item.role}`]]}>
              <Text style={styles.badgeText}>{item.role}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardDetails}>
          {item.department ? (
            <Text style={styles.detailsText} numberOfLines={1}>
              <FontAwesome name="building-o" size={13} color="#666" />  {item.department}
            </Text>
          ) : null}
          {item.role === 'faculty' && item.designation ? (
            <Text style={styles.detailsText}>
              <FontAwesome name="id-badge" size={13} color="#666" />  {item.designation}
            </Text>
          ) : null}
          {item.role === 'student' && item.registerNumber ? (
            <Text style={styles.detailsText}>
              <FontAwesome name="graduation-cap" size={13} color="#666" />  Reg: {item.registerNumber}
            </Text>
          ) : null}
          {item.role === 'faculty' && item.employeeId ? (
            <Text style={styles.detailsText}>
              <FontAwesome name="id-card-o" size={13} color="#666" />  Emp ID: {item.employeeId}
            </Text>
          ) : null}
        </View>

        {/* Quick Card Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.btnView]} 
            onPress={() => setSelectedProfile(item)}
          >
            <FontAwesome name="eye" size={14} color="#1a237e" />
            <Text style={styles.btnTextPrimary}>Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.btnChat]} 
            onPress={() => handleStartChat(item)}
          >
            <FontAwesome name="comment" size={14} color="#fff" />
            <Text style={styles.btnTextWhite}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <FontAwesome name="search" size={16} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, register no..."
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <FontAwesome name="times-circle" size={18} color="#888" style={styles.clearSearchIcon} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter / Sort Layout Options Panel */}
      <View style={styles.filterSection}>
        <View style={styles.pickerRow}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={role}
              onValueChange={(val) => { setRole(val); setPage(1); }}
              style={styles.picker}
            >
              <Picker.Item label="All Roles" value="" />
              <Picker.Item label="Students" value="student" />
              <Picker.Item label="Faculty" value="faculty" />
              <Picker.Item label="Admins" value="admin" />
            </Picker>
          </View>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={department}
              onValueChange={(val) => { setDepartment(val); setPage(1); }}
              style={styles.picker}
            >
              <Picker.Item label="All Depts" value="" />
              {departments.map((d) => (
                <Picker.Item key={d._id} label={d.code} value={d._id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.filterFooter}>
          <View style={styles.sortWrapper}>
            <Text style={styles.sortLabel}>Sort:</Text>
            <View style={styles.smallPickerWrapper}>
              <Picker
                selectedValue={sortBy}
                onValueChange={(val) => { setSortBy(val); setPage(1); }}
                style={styles.smallPicker}
              >
                <Picker.Item label="Name" value="name" />
                <Picker.Item label="Department" value="department" />
                <Picker.Item label="Role" value="role" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilters}>
            <FontAwesome name="refresh" size={12} color="#f44336" />
            <Text style={styles.clearBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Render Main Area */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.centerText}>Loading contacts...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <FontAwesome name="exclamation-circle" size={48} color="#f44336" />
          <Text style={styles.errorLabel}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchContacts}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.centerBox}>
          <FontAwesome name="user-times" size={48} color="#ccc" />
          <Text style={styles.centerText}>No contacts found matching filter criteria.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={contacts}
            renderItem={renderContactCard}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.listContainer}
          />

          {/* Pagination Controls */}
          <View style={styles.paginationRow}>
            <TouchableOpacity 
              style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
              disabled={page === 1}
              onPress={() => setPage(p => Math.max(p - 1, 1))}
            >
              <FontAwesome name="chevron-left" size={12} color={page === 1 ? '#999' : '#1a237e'} />
              <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
            </TouchableOpacity>

            <Text style={styles.pageLabel}>Page {page} of {totalPages}</Text>

            <TouchableOpacity 
              style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
              disabled={page >= totalPages}
              onPress={() => setPage(p => Math.min(p + 1, totalPages))}
            >
              <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}>Next</Text>
              <FontAwesome name="chevron-right" size={12} color={page >= totalPages ? '#999' : '#1a237e'} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Profile Detail Bottom-Sheet / Modal */}
      {selectedProfile && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedProfile}
          onRequestClose={() => setSelectedProfile(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>User Profile</Text>
                <TouchableOpacity onPress={() => setSelectedProfile(null)}>
                  <FontAwesome name="times" size={20} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                <View style={styles.modalAvatarContainer}>
                  <View style={styles.largeAvatar}>
                    <Text style={styles.largeAvatarText}>
                      {selectedProfile.name ? selectedProfile.name.substring(0, 2).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <Text style={styles.modalName}>{selectedProfile.name}</Text>
                  <View style={[styles.badge, styles[`badge_${selectedProfile.role}`], { marginTop: 8 }]}>
                    <Text style={styles.badgeText}>{selectedProfile.role}</Text>
                  </View>
                </View>

                {/* Profile Details List */}
                <View style={styles.modalInfoGroup}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Email</Text>
                    <Text style={styles.infoVal}>{selectedProfile.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Phone</Text>
                    <Text style={styles.infoVal}>{selectedProfile.phone || 'N/A'}</Text>
                  </View>
                  {selectedProfile.department ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>Department</Text>
                      <Text style={styles.infoVal}>{selectedProfile.department}</Text>
                    </View>
                  ) : null}
                  {selectedProfile.role === 'faculty' && selectedProfile.designation ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>Designation</Text>
                      <Text style={styles.infoVal}>{selectedProfile.designation}</Text>
                    </View>
                  ) : null}
                  {selectedProfile.role === 'student' && selectedProfile.registerNumber ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>Register No</Text>
                      <Text style={styles.infoVal}>{selectedProfile.registerNumber}</Text>
                    </View>
                  ) : null}
                  {selectedProfile.role === 'faculty' && selectedProfile.employeeId ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>Employee ID</Text>
                      <Text style={styles.infoVal}>{selectedProfile.employeeId}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Full Profile Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalActionBtn, styles.mBtnChat]}
                    onPress={() => handleStartChat(selectedProfile)}
                  >
                    <FontAwesome name="comment" size={16} color="#fff" />
                    <Text style={styles.mBtnTextWhite}>Message</Text>
                  </TouchableOpacity>

                  <View style={styles.actionGrid}>
                    <TouchableOpacity 
                      style={styles.modalGridBtn}
                      onPress={() => {
                        copyToClipboard(selectedProfile.email);
                        Alert.alert('Success', 'Email address copied to clipboard');
                      }}
                    >
                      <FontAwesome name="copy" size={14} color="#1a237e" />
                      <Text style={styles.gridBtnText}>Copy Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.modalGridBtn}
                      disabled={!selectedProfile.phone}
                      onPress={() => {
                        if (selectedProfile.phone) {
                          copyToClipboard(selectedProfile.phone);
                          Alert.alert('Success', 'Phone number copied to clipboard');
                        }
                      }}
                    >
                      <FontAwesome name="clipboard" size={14} color={selectedProfile.phone ? "#1a237e" : "#ccc"} />
                      <Text style={[styles.gridBtnText, !selectedProfile.phone && { color: '#ccc' }]}>Copy Phone</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.modalGridBtn}
                      onPress={() => sendEmail(selectedProfile.email)}
                    >
                      <FontAwesome name="envelope-o" size={14} color="#1a237e" />
                      <Text style={styles.gridBtnText}>Email Client</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.modalGridBtn}
                      disabled={!selectedProfile.phone}
                      onPress={() => {
                        if (selectedProfile.phone) {
                          makeCall(selectedProfile.phone);
                        }
                      }}
                    >
                      <FontAwesome name="phone" size={14} color={selectedProfile.phone ? "#1a237e" : "#ccc"} />
                      <Text style={[styles.gridBtnText, !selectedProfile.phone && { color: '#ccc' }]}>Call Mobile</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  searchSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    margin: 12, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 2 }
    })
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  clearSearchIcon: { marginLeft: 8 },
  
  filterSection: { backgroundColor: '#fff', padding: 12, marginHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 8 },
  pickerRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  pickerWrapper: { flex: 1, height: 40, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, justifyContent: 'center', backgroundColor: '#f9f9f9' },
  picker: { width: '100%', height: 40, color: '#333' },
  
  filterFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sortWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortLabel: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  smallPickerWrapper: { width: 120, height: 32, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, justifyContent: 'center', backgroundColor: '#f9f9f9' },
  smallPicker: { width: '100%', height: 32, color: '#333' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1, borderColor: '#f44336' },
  clearBtnText: { fontSize: 12, color: '#f44336', fontWeight: 'bold' },
  
  listContainer: { padding: 12, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e8eaf6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#1a237e', fontWeight: 'bold', fontSize: 16 },
  headerInfo: { flex: 1, gap: 2 },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff', textTransform: 'capitalize' },
  badge_student: { backgroundColor: '#4caf50' },
  badge_faculty: { backgroundColor: '#ff9800' },
  badge_admin: { backgroundColor: '#f44336' },
  
  cardDetails: { gap: 6, marginBottom: 12 },
  detailsText: { fontSize: 13, color: '#666', flexDirection: 'row', alignItems: 'center' },
  
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 36, borderRadius: 6, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  btnView: { borderWidth: 1, borderColor: '#1a237e', backgroundColor: '#fff' },
  btnChat: { backgroundColor: '#1a237e' },
  btnTextPrimary: { color: '#1a237e', fontWeight: 'bold', fontSize: 13 },
  btnTextWhite: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  centerText: { fontSize: 14, color: '#666', textAlign: 'center' },
  errorLabel: { fontSize: 14, color: '#f44336', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1a237e', borderRadius: 4 },
  retryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e0e0e0' },
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#1a237e', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
  pageBtnDisabled: { borderColor: '#ccc' },
  pageBtnText: { color: '#1a237e', fontWeight: 'bold', fontSize: 13 },
  pageBtnTextDisabled: { color: '#999' },
  pageLabel: { fontSize: 13, color: '#666' },

  // Modal styling
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#e0e0e0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalBody: { padding: 16 },
  modalAvatarContainer: { alignItems: 'center', marginBottom: 20 },
  largeAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e8eaf6', justifyContent: 'center', alignItems: 'center' },
  largeAvatarText: { color: '#1a237e', fontWeight: 'bold', fontSize: 24 },
  modalName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 10 },
  
  modalInfoGroup: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, backgroundColor: '#f9f9f9', padding: 12, gap: 10, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#e0e0e0', paddingBottom: 8 },
  infoKey: { fontSize: 13, color: '#666' },
  infoVal: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  
  modalActions: { gap: 12 },
  modalActionBtn: { height: 44, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  mBtnChat: { backgroundColor: '#1a237e' },
  mBtnTextWhite: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modalGridBtn: { width: '48%', height: 40, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#fff' },
  gridBtnText: { fontSize: 12, fontWeight: 'bold', color: '#333' }
});

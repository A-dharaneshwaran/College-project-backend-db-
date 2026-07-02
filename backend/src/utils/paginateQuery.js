/**
 * Builds a Mongoose query with pagination, search, sort, and filter.
 *
 * @param {import('mongoose').Model} model - Mongoose model
 * @param {Object} query - Express req.query
 * @param {Object} options
 * @param {Array<string>} options.searchFields - Fields to search in
 * @param {Array<string>} options.filterFields - Allowed filter fields
 * @param {string} options.populate - Mongoose populate string
 * @param {string} options.defaultSort - Default sort field (e.g. '-createdAt')
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
const paginateQuery = async (model, query, options = {}) => {
  const {
    searchFields = [],
    filterFields = [],
    populate = '',
    defaultSort = '-createdAt',
    select = '',
  } = options;

  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  const sort = query.sort || defaultSort;

  // Build filter
  const filter = {};

  // Search
  if (query.search && searchFields.length > 0) {
    filter.$or = searchFields.map((field) => ({
      [field]: { $regex: query.search, $options: 'i' },
    }));
  }

  // Field filters
  filterFields.forEach((field) => {
    if (query[field] !== undefined && query[field] !== '') {
      filter[field] = query[field];
    }
  });

  const [data, total] = await Promise.all([
    model
      .find(filter)
      .populate(populate)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

module.exports = paginateQuery;

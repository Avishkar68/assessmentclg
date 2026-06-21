/**
 * Reusable utility to handle pagination, filtering, and searching on Mongoose models
 * @param {Object} model - Mongoose Model
 * @param {Object} queryParams - req.query object containing filters, page, limit, search
 * @param {Array<string>} searchFields - fields to search on (e.g. ['questionText'])
 * @param {Object} baseFilter - additional base filters (e.g. authorization filters like { createdBy: user._id })
 * @param {Array|string|Object} populateOptions - optional fields to populate
 * @returns {Promise<Object>} Object containing total, page, pages, results
 */
const executePaginatedQuery = async (
  model,
  queryParams,
  searchFields = [],
  baseFilter = {},
  populateOptions = null
) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build the Mongoose filter criteria object
  const filter = { ...baseFilter };

  // 1. Searching (fuzzy query using case-insensitive regex on specified fields)
  if (queryParams.search && searchFields.length > 0) {
    const searchRegex = new RegExp(queryParams.search, 'i');
    filter.$or = searchFields.map((field) => ({ [field]: searchRegex }));
  }

  // 2. Filtering (only filter on paths defined in the model's schema)
  const schemaPaths = Object.keys(model.schema.paths);
  const excludeFields = ['page', 'limit', 'search'];

  Object.keys(queryParams).forEach((key) => {
    if (
      !excludeFields.includes(key) &&
      schemaPaths.includes(key) &&
      queryParams[key] !== undefined &&
      queryParams[key] !== ''
    ) {
      filter[key] = queryParams[key];
    }
  });

  // Calculate total documents matching the filter criteria
  const total = await model.countDocuments(filter);

  // Execute query with skip, limit, and population options
  let query = model.find(filter).skip(skip).limit(limit);

  if (populateOptions) {
    query = query.populate(populateOptions);
  }

  const results = await query;

  const pages = Math.ceil(total / limit) || 1;

  return {
    total,
    page,
    pages,
    results
  };
};

module.exports = {
  executePaginatedQuery
};

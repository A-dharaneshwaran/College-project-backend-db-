/**
 * Standardized API response format.
 * Every successful response follows: { success: true, message, data }
 */
class ApiResponse {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {*} data
   */
  constructor(statusCode, message, data = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }

  /**
   * Send the response through Express res object.
   * @param {import('express').Response} res
   */
  send(res) {
    return res.status(this.success ? 200 : 500).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }

  static success(res, message, data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, message, data = null) {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static paginated(res, message, data, pagination) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }
}

module.exports = ApiResponse;

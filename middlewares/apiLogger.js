const { STATUS_CODES } = require("http");

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value) && !Buffer.isBuffer(value);

const formatTimestamp = (date = new Date()) => {
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

module.exports = (req, res, next) => {
  if (!req.originalUrl.startsWith("/api/")) {
    return next();
  }

  let responsePayload;

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body) => {
    responsePayload = body;
    return originalJson(body);
  };

  res.send = (body) => {
    responsePayload = body;
    return originalSend(body);
  };

  res.on("finish", () => {
    const timestamp = formatTimestamp();
    const method = req.method;
    const endpoint = req.originalUrl;
    const statusCode = res.statusCode;
    const statusText = STATUS_CODES[statusCode] || "";

    let message = "";
    if (isPlainObject(responsePayload) && responsePayload.message) {
      message = responsePayload.message;
    } else if (typeof responsePayload === "string" && !responsePayload.trim().startsWith("<")) {
      message = responsePayload;
    } else if (Buffer.isBuffer(responsePayload)) {
      message = "Binary response";
    } else {
      message = statusText || "Request completed";
    }

    console.log(`[${timestamp}] ${method} ${endpoint}`);
    console.log(`Response: ${statusCode} ${statusText}`.trim());
    console.log(`Message: ${message}`);
    console.log("");
  });

  next();
};

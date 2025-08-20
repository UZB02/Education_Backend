// middlewares/checkPermission.js
export const checkPermission = (permission) => (req, res, next) => {
  if (!req.admin.permissions[permission]) {
    return res.status(403).json({ message: "Sizda ruxsat yo'q" });
  }
  next();
};

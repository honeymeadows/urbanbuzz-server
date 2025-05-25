export default async function admin(req, res, next) {
  if (req.user.roles.isAdmin || req.user.roles.isSuperAdmin) {
    next();
  } else {
    return res.status(403).json({ message: "only authorized users can perform this action." });
  }
}

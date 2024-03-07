async function authorizedMember(req, res, next) {
  if (req.user.role != "IRBAdmin" && req.user.role != "IRBMember") {
    res.status(401).json({ message: "Unauthorized" });
  }

  next();
}

async function authorizedAdmin(req, res, next) {
  if (req.user.role != "IRBAdmin") {
    res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

module.exports = {
  authorizedMember,
  authorizedAdmin,
};

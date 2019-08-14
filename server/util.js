
const uploadPath = __rootdir + "/uploads";
const getPath = (group, name) => `${uploadPath}/${group}/${name}`;

module.exports = {getPath};
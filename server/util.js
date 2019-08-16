
const uploadPath = __rootdir + "/uploads";
const getPath = (group, name) => `${uploadPath}/${group}/${name}`;
const getTestDir = group => `${uploadPath}/${group}`;

module.exports = {getPath, getTestDir};

const uploadPath = __rootdir + "/uploads/tests";
const getPath = (group, name) => `${uploadPath}/${group}/${name}`;
const getTestDir = group => `${uploadPath}/${group}`;

const graderPath = __rootdir + "/graders";
const getGraderDir = name => `${graderPath}/${name}`;

module.exports = {getPath, getTestDir, getGraderDir};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
exports.default = async ({ outDir }) => {
    await (0, fs_extra_1.ensureDir)(outDir);
    await (0, fs_extra_1.emptyDir)(outDir);
    await (0, fs_extra_1.ensureDir)(`${outDir}/bundling/entry-points`);
};

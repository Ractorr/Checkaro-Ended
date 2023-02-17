"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateClientEntryPoints = exports.generateServerEntryPoint = exports.checkForPackages = exports.entryPoint = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const lodash_1 = require("lodash");
const get_variable_1 = __importDefault(require("../../utils/get-variable"));
const entry_exists_1 = __importDefault(require("./entry-exists"));
/**
 * Resolve the path of a package.
 *
 * @param options - Defined in {@link EntryPointOptions}.
 * @returns The path of the package.
 */
const entryPoint = async ({ name, mode, type, }) => {
    let extension = false;
    if (mode !== "default") {
        // Check first inside the mode and in the type.
        extension = await (0, entry_exists_1.default)(`${name}/src/${mode}/${type}`);
        if (extension)
            return `${name}/src/${mode}/${type}`;
        // Check first inside the mode and in the type but in a folder.
        extension = await (0, entry_exists_1.default)(`${name}/src/${mode}/${type}/index`);
        if (extension)
            return `${name}/src/${mode}/${type}/index`;
        // If it's client or server, check on index as well.
        if (type === "client" || type === "server") {
            // Check if it's a file.
            extension = await (0, entry_exists_1.default)(`${name}/src/${mode}`);
            if (extension) {
                return `${name}/src/${mode}`;
            }
            // Check if it's a folder.
            extension = await (0, entry_exists_1.default)(`${name}/src/${mode}/index`);
            if (extension) {
                return `${name}/src/${mode}/index`;
            }
        }
    }
    // Check now outside of the mode for the specific type.
    extension = await (0, entry_exists_1.default)(`${name}/src/${type}`);
    if (extension)
        return `${name}/src/${type}`;
    // Check now outside of the mode for the specific type but in a folder.
    extension = await (0, entry_exists_1.default)(`${name}/src/${type}/index`);
    if (extension)
        return `${name}/src/${type}/index`;
    // And finally, if it's client or server, check on index as well.
    extension = await (0, entry_exists_1.default)(`${name}/src/index`);
    if ((type === "client" || type === "server") && extension) {
        return `${name}/src/index`;
    }
    // Don't return path if no entry point is found.
    return "";
};
exports.entryPoint = entryPoint;
/**
 * Throw an error if any of the packages defined in the settings is not
 * installed.
 *
 * @param options - Defined in {@link CheckForPackagesOptions}.
 */
const checkForPackages = async ({ sites, }) => {
    // Turn the list into an array of package names.
    const packages = (0, lodash_1.uniq)((0, lodash_1.flatten)(sites.map((site) => site.packages)));
    await Promise.all(
    // Iterate over the packages.
    packages.map(async (name) => {
        // Check if the folder exists.
        const exists = await (0, fs_extra_1.pathExists)((0, path_1.resolve)(process.cwd(), "node_modules", name));
        if (!exists)
            throw new Error(`The package "${name}" doesn't seem to be installed. Make sure you did "npm install ${name}"`);
    }));
};
exports.checkForPackages = checkForPackages;
/**
 * Turn a list of sites into a list of packages that can be used to create the
 * templates.
 *
 * @param options - Defined in {@link GetPackagesListOptions}.
 * @returns The list of packages for each site.
 */
const getPackagesList = async ({ sites, type, }) => {
    // Get a flat array of unique packages and its modes.
    const packages = (0, lodash_1.uniqBy)((0, lodash_1.flatten)(sites.map((site) => site.packages.map((name) => ({ mode: site.mode, name })))), ({ mode, name }) => `${mode}${name}`);
    return (await Promise.all(
    // Iterate over the packages.
    packages.map(async ({ name, mode }) => {
        // Check if the entry point of that mode exists.
        const path = await (0, exports.entryPoint)({ name, mode, type });
        return { name, mode, path };
    })
    // Remove the packages where the entry point doesn't exist.
    )).filter(({ path }) => path !== "");
};
/**
 * Generate the template part that contains the imports section.
 *
 * @param options - Defined in {@link GenerateImportsTemplateOptions}.
 * @returns The template part.
 */
const generateImportsTemplate = ({ packages, type, }) => {
    let template = `import ${type} from "@frontity/core/src/${type}";\n`;
    // Create the "import" part of the file.
    packages.forEach(({ name, mode, path }) => (template += `import ${(0, get_variable_1.default)(name, mode)} from "${path}";\n`));
    // Create the "const packages = {...}" part of the file.
    template += "\nconst packages = {\n";
    packages.forEach(({ name, mode }) => (template += `  ${(0, get_variable_1.default)(name, mode)},\n`));
    template += "};\n\n";
    template += `export default ${type}({ packages });\n\n`;
    return template;
};
/**
 * Generate the template part that contains the HMR section.
 *
 * @param options - Defined in {@link GenerateHotModuleTemplateOptions}.
 * @returns The template part.
 */
const generateHotModuleTemplate = ({ packages, template, }) => {
    template += `if (module["hot"]) {
  module["hot"].accept(
    [
      "@frontity/core/src/client",\n`;
    packages.forEach(({ path }) => {
        template += `      "${path}",\n`;
    });
    template += `    ],
    () => {
      const client = require("@frontity/core/src/client").default;\n`;
    packages.forEach(({ name, mode, path }) => (template += `      const ${(0, get_variable_1.default)(name, mode)} = require("${path}").default;\n`));
    template += "      const packages = {\n";
    packages.forEach(({ name, mode }) => (template += `        ${(0, get_variable_1.default)(name, mode)},\n`));
    template +=
        "      };\n      client({ packages, isHmr: true });\n    }\n  );\n}";
    return template;
};
/**
 * Create an entry-point file for the server and return the bundle name and
 * path.
 *
 * @param options - Defined in {@link GenerateServerEntryPointOptions}.
 * @returns The name and path of the final server bundle.
 */
const generateServerEntryPoint = async ({ sites, outDir, }) => {
    const packages = await getPackagesList({ sites, type: "server" });
    const template = generateImportsTemplate({ packages, type: "server" });
    // Write the file and return the bundle.
    const path = `${outDir}/bundling/entry-points/server.ts`;
    await (0, fs_extra_1.writeFile)(path, template, "utf8");
    return { name: "server", path };
};
exports.generateServerEntryPoint = generateServerEntryPoint;
/**
 * Create entry-point files for the client and return all the bundle names and
 * paths.
 *
 * @param options - Defined in {@link GenerateEntryPointsOptions}.
 * @returns The name and path of the final client bundles.
 */
const generateClientEntryPoints = async ({ sites, outDir, mode, }) => {
    return (await Promise.all(
    // Iterate over the sites
    sites.map(async (site) => {
        const packages = await getPackagesList({
            sites: [site],
            type: "client",
        });
        if (packages.length === 0)
            return;
        let template = generateImportsTemplate({
            packages,
            type: "client",
        });
        if (mode === "development") {
            template = generateHotModuleTemplate({ template, packages });
        }
        // Create sub-folder for site.
        await (0, fs_extra_1.ensureDir)(`${outDir}/bundling/entry-points/${site.name}`);
        // Write the file and return the bundle.
        const path = `${outDir}/bundling/entry-points/${site.name}/client.ts`;
        await (0, fs_extra_1.writeFile)(path, template, "utf8");
        return { name: site.name, path };
    })
    // Filter non-existent bundles.
    )).filter((bundle) => bundle);
};
exports.generateClientEntryPoints = generateClientEntryPoints;
/**
 * Create entry-point files and return all the bundle names and paths.
 *
 * @param options - Defined in {@link GenerateEntryPointsOptions}.
 * @returns The name and path of the final bundles.
 */
const generateEntryPoints = async ({ sites, outDir, mode, }) => {
    // Check if all the packages are installed.
    await (0, exports.checkForPackages)({ sites });
    // Generate the bundles. One for the server.
    const serverEntryPoints = await (0, exports.generateServerEntryPoint)({ sites, outDir });
    const clientEntryPoints = await (0, exports.generateClientEntryPoints)({
        sites,
        outDir,
        mode,
    });
    return [...clientEntryPoints, serverEntryPoints];
};
exports.default = generateEntryPoints;

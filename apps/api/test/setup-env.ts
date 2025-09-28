import * as path from "path"
import * as fs from "fs"
import * as dotenv from "dotenv"

const testEnv = path.resolve(process.cwd(), '.env.test');
if(fs.existsSync(testEnv)) {
    dotenv.config({ path: testEnv });
}
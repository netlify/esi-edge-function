const fs = require("fs").promises;

async function build() {
    await fs.mkdir("./dist", { recursive: true });
    await fs.cp("./src", "./dist", { recursive: true });
}

build();
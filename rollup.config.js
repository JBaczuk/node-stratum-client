import typescript from "rollup-plugin-typescript"

export default [{
  input: "src/index.ts",
  plugins: [
    typescript({ typescript: require("typescript") })
  ],
  output: [{
    file: "bin/index.js",
    format: "cjs",
    sourcemap: true 
  }]
}]

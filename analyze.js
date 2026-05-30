const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory()
        ? walkSync(dirFile, filelist)
        : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EACCES') { } else { throw err; }
    }
  });
  return filelist;
};

const dirs = ['frontend/src', 'backend/src', 'backend/prisma'];
let allFiles = [];
dirs.forEach(d => { allFiles = allFiles.concat(walkSync(d)); });
allFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.prisma') || f.endsWith('.css'));

let report = "Project Analysis:\n\n";
let totalLines = 0;

allFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  totalLines += lines.length;
  
  // Extract imports
  const imports = lines.filter(l => l.startsWith('import ')).map(l => l.trim());
  
  // Extract exports
  const exports = lines.filter(l => l.startsWith('export ')).map(l => l.trim());
  
  // Extract endpoints (if backend)
  const endpoints = lines.filter(l => l.match(/router\.(get|post|put|delete|patch)\(/)).map(l => l.trim());
  
  report += `File: ${f} (${lines.length} lines)\n`;
  if (exports.length) report += `  Exports: ${exports.length} items\n`;
  if (endpoints.length) report += `  Endpoints: ${endpoints.length} routes\n`;
});

report += `\nTotal files: ${allFiles.length}\n`;
report += `Total lines: ${totalLines}\n`;

fs.writeFileSync('analysis_report.txt', report);
console.log("Analysis complete. Found " + allFiles.length + " files and " + totalLines + " lines.");

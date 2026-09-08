import fs from 'fs';

async function run() {
  const baseUrl = "https://raw.githubusercontent.com/a58293/panl-d/main/images";
  let content = fs.readFileSync('src/content.ts', 'utf8');
  
  const counts = {
    1: 3,
    2: 1,
    3: 0,
    4: 4,
    5: 5,
    6: 5,
    7: 3,
    8: 0,
    9: 5,
    10: 0,
    11: 0,
    12: 0,
    13: 6
  };
  
  // Replace the _graphicProjects array
  const regex = /const _graphicProjects: ProjectItem\[\] = \[[\s\S]*?\];/;
  
  let newGraphicProjects = 'const _graphicProjects: ProjectItem[] = [\n';
  for (let i = 1; i <= 13; i++) {
    const idStr = String(i).padStart(2, '0');
    const count = counts[i];
    
    newGraphicProjects += `  { \n`;
    newGraphicProjects += `    id: ${i}, \n`;
    newGraphicProjects += `    title: "Project ${idStr}", \n`;
    newGraphicProjects += `    src: \`\${BASE_URL}/graphic/${idStr}.webp\`,\n`;
    if (count > 0) {
      if (count === 1) {
        newGraphicProjects += `    galleryImages: [\`\${BASE_URL}/graphic/${idStr}-1.webp\`]\n`;
      } else {
        newGraphicProjects += `    galleryImages: Array.from({ length: ${count} }, (_, i) => \`\${BASE_URL}/graphic/${idStr}-\${i + 1}.webp\`)\n`;
      }
    } else {
      newGraphicProjects += `    galleryImages: []\n`;
    }
    newGraphicProjects += `  }${i < 13 ? ',' : ''}\n`;
  }
  newGraphicProjects += '];';
  
  content = content.replace(regex, newGraphicProjects);
  fs.writeFileSync('src/content.ts', content);
  console.log('Updated content.ts');
}
run();

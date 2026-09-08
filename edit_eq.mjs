const fs=require('fs');
let c=fs.readFileSync('src/components/Player/EqualizerPanel.jsx','utf8');
c=c.replace('  Flat: [0, 0, 0, 0, 0],','  Normal: [0, 0, 0, 0, 0],');
c=c.replace("useState('Rock')","useState('Normal')");
c=c.replace('useState(PRESET_MAP.Rock)','useState(PRESET_MAP.Normal)');
fs.writeFileSync('src/components/Player/EqualizerPanel.jsx',c);
console.log('EQ done');

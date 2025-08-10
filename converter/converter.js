const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class WebMConverter {
    constructor() {
        this.inputDir = './input';
        this.outputDir = './output';
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.inputDir)) {
            fs.mkdirSync(this.inputDir, { recursive: true });
        }
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    convertFile(inputFile, outputFile = null) {
        return new Promise((resolve, reject) => {
            // Generate output filename if not provided
            if (!outputFile) {
                const filename = path.basename(inputFile, path.extname(inputFile));
                outputFile = path.join(this.outputDir, `${filename}.mp4`);
            }

            console.log(`Converting: ${inputFile} -> ${outputFile}`);

            // FFmpeg command arguments
            const args = [
                '-i', inputFile,           // Input file
                '-c:v', 'libx264',         // Video codec
                '-c:a', 'aac',             // Audio codec
                '-preset', 'medium',        // Encoding speed/quality balance
                '-crf', '23',              // Quality (lower = better quality)
                '-movflags', '+faststart', // Web optimization
                '-y',                      // Overwrite output file
                outputFile
            ];

            const ffmpeg = spawn('ffmpeg', args);

            let stderr = '';

            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
                // Show progress
                const timeMatch = data.toString().match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
                if (timeMatch) {
                    process.stdout.write(`\rProgress: ${timeMatch[1]}`);
                }
            });

            ffmpeg.on('close', (code) => {
                console.log(''); // New line after progress
                if (code === 0) {
                    console.log(`✅ Conversion completed: ${outputFile}`);
                    resolve(outputFile);
                } else {
                    console.error(`❌ Conversion failed with code ${code}`);
                    console.error(stderr);
                    reject(new Error(`FFmpeg failed with code ${code}`));
                }
            });

            ffmpeg.on('error', (err) => {
                console.error(`❌ FFmpeg error: ${err.message}`);
                reject(err);
            });
        });
    }

    async convertAll() {
        try {
            const files = fs.readdirSync(this.inputDir)
                .filter(file => file.toLowerCase().endsWith('.webm'));

            if (files.length === 0) {
                console.log('No .webm files found in input directory');
                return;
            }

            console.log(`Found ${files.length} WebM file(s)`);

            for (const file of files) {
                const inputPath = path.join(this.inputDir, file);
                await this.convertFile(inputPath);
            }

            console.log('🎉 All conversions completed!');
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    async convertSingle(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            await this.convertFile(filePath);
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
}

// Usage
async function main() {
    const converter = new WebMConverter();
    const args = process.argv.slice(2);

    if (args.length > 0) {
        // Convert specific file
        const inputFile = args[0];
        const outputFile = args[1] || null;
        
        if (outputFile) {
            await converter.convertFile(inputFile, outputFile);
        } else {
            await converter.convertSingle(inputFile);
        }
    } else {
        // Convert all files in input directory
        console.log('No file specified. Converting all .webm files in ./input/ directory...');
        await converter.convertAll();
    }
}

// Check if FFmpeg is available
function checkFFmpeg() {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('error', () => {
        console.error('❌ FFmpeg not found. Please install FFmpeg first.');
        console.log('Install instructions:');
        console.log('Windows: Download from https://ffmpeg.org/download.html');
        console.log('macOS: brew install ffmpeg');
        console.log('Linux: sudo apt install ffmpeg (Ubuntu/Debian)');
        process.exit(1);
    });
    
    ffmpeg.on('close', () => {
        main();
    });
}

checkFFmpeg();
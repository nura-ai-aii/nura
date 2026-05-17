const { spawn } = require('child_process');
const path = require('path');

function startProcess(name, command, args, cwd) {
    console.log(`[STARTING] ${name}...`);
    const proc = spawn(command, args, {
        cwd: cwd,
        shell: true,
        stdio: 'inherit'
    });

    proc.on('error', (err) => {
        console.error(`[ERROR] Failed to start ${name}:`, err);
    });

    proc.on('close', (code) => {
        console.log(`[EXIT] ${name} exited with code ${code}`);
    });

    return proc;
}

const backend = startProcess('BACKEND', 'node', ['server.js'], path.join(__dirname, 'back-end'));
const frontend = startProcess('FRONTEND', 'cmd', ['/c', 'npm start'], path.join(__dirname, 'front-end'));

process.on('SIGINT', () => {
    console.log('\n[STOPPING] Shutting down J.A.R.V.I.S...');
    backend.kill();
    frontend.kill();
    process.exit();
});

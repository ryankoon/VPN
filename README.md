# VPN
CPEN 442 - A3

**Node.js**  
v10.12.0

**Updating NPM**  
`npm install npm@latest -g`

**Getting started**  
1. Get the latest version of Node.js (v10.12.0)
2. Update NPM (see above)
3. Run `npm install`
4. Compile UI by running PowerShell script `public/compile.ps1`

**Running**  
run `npm start`  
For more information, see: https://electronjs.org/
  
**Package app for distribution**  
run `npm run dist`  
For more information, see: https://github.com/electron-userland/electron-builder

**Ports in use**  
Port `8088` on IP address `127.0.0.1` is in use for serving the UI.   
In server mode, the specified port is bound to `0.0.0.0`.
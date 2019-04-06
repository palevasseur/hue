# Philips hue

# Xiaomi Aqara

### Gateway configuration
Need to set Mi Home application to "Chinese Mainland" to be able to detect the gateway
https://www.openhab.org/addons/bindings/mihome/

### Switch configuration
Add switch "interrupteur télécommandé sans fil Aqara"
- open "Mi Home" app
- activate wifi
- [+] on the top right (no bluetooth)
- filter "aqara", select "Interrupteur télécommandé sans fil Aqara (bascule simple)" (if several in the list try last)
- press the switch during 10s => switch light blue blink 3 times => display confirmation added ok
- launch "node index.js" to check SID of new switch

# Compile and run
[git clone https://github.com/palevasseur/hue.git]  
[npm run compile]  
[node index.js]  

# Deploy on Raspberry
### deploy
on raspberry:
 - install modules [npm install --only=production]
 - copy the bundles using lftp
```
cmd to ftp dist/bundle files into ~/Projects/hue folder (hue folder must exist):
lftp -e "set sftp:auto-confirm yes; set sftp:connect-program 'ssh'; open sftp://pi:password@192.168.1.16:22; cd Projects/hue; put ./dist/bundle-hue-back.js; bye"
```

### install lftp on Window
- download zip https://lftp.nwgat.ninja/ and unzip to C:\Program Files
- add PATH env var "C:\Program Files\lftp-4.7.7.win64-openssl\bin"


### launch script on boot
add cron task: [sudo crontab -e]
```
@reboot /usr/bin/node /home/pi/Projects/hue/bundle-hue-back.js > /home/pi/Projects/hue/hue.log 2>&1 &
```
# Related
https://github.com/peter-murray/node-hue-api  
https://github.com/marvinroger/node-lumi-aqara  

https://github.com/aholstenson/miio  
https://github.com/ioBroker/ioBroker.zigbee  

# Philips hue

# Xiaomi Aqara

### Gateway configuration
Need to set Mi Home application to "Chinese Mainland" to be able to detect the gateway

### Switch configuration
Add switch "interrupteur télécommandé sans fil Aqara"
- open "Mi Home" app
- activate wifi
- [+] on the top right (no bluetooth)
- filter "aqara", select "Interrupteur télécommandé sans fil Aqara (bascule simple)" (if several in the list try last)
- press the switch during 10s => switch light blue blink 3 times => display confirmation added ok
- launch "node index.js" to check SID of new switch

# Compile and run
- [git clone https://github.com/palevasseur/hue.git]
- [npm run compile]
- [node index.js]

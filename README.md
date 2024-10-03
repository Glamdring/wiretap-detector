# Wiretap Detector

Wiretap Detector is a React Native app that uses various heuristics in order to detect if a cell-site simulator (also popularly referred to as Stingray or IMSI-catcher) is currently being deployed and used against the phone on which the app is installed.

Detection works on active cell-site simulators that are acting as a "man in the middle", forcing the phome to connect to them. The heuristics include:
- detecting if the currwnt public IP is in the publicly announced IP range of the telecom
- detecting changes in the internal IP adresses obtained via a traceroute
- detecting a mismatch between the cell ID and geolocation, based on previous data about legitimate cells

The app does not require root privileges and does not communicate any data to a server. For IP and ASN metadata, the app uses https://ip.guide 

The app does not guarantee detection in all cases, nor does it prevent eavesdropping.

Pull requests and new heuristics are welcome.

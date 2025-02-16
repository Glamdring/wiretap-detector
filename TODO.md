# Wiretap Detector TODO list

The following features are on the roadmap:

- Build and publish for iOS

- Upgrade schema details with each upgrade, rather than having to cleanup the database, e.g. using [this plugin](https://embusinessproducts.com/react-native-sqlite-database-upgrade-strategy)

- Port the [AimsicdService](https://github.com/CellularPrivacy/Android-IMSI-Catcher-Detector/blob/development/AIMSICD/src/main/java/com/secupwn/aimsicd/service/AimsicdService.java) from Android IMSI Catcher

- Investigate additional location heuristics, e.g. using [get_location_by_cell method](https://gist.github.com/creotiv/3713832) or [this answer](https://stackoverflow.com/questions/31020866/android-finding-location-using-lac-and-cid)

- Compare the mnc detected country from the cell info with the current location

- Support VoWiFi for detection

- Detect unepxected roaming which is used for ss7 attacks; receive a notification on roaming activation

- Review [AKA process](https://www.ericsson.com/en/blog/2021/9/authentication-and-key-agreements) for potential clues on detection

- Show the failure reasons in a readable way in the dialog

- Make a centralized database with detections metadata

- Compare with public cell databases; compare more cell metadata

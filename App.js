import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import {Notifications} from 'react-native-notifications';
import DefaultPreference from 'react-native-default-preference';

export default function App() {
  const COMPARE_IP_TASK = "bg.bozho.iprangewatcher.compareIP";
  const REFRESH_RANGES_TASK = "bg.bozho.iprangewatcher.refreshRanges";
  
  const ASNS = {
    "A1": "AS12716",
    "Vivacom": "AS8866",
    "Telenor": "AS9158"
  }
  
  BackgroundFetch.configure(
    {
      stopOnTerminate: false,
      startOnBoot: true
    },
    async (taskId) => {
	  switch (taskId) {
      case COMPARE_IP_TASK: 
        compareIP();
        break;
      case REFRESH_RANGES_TASK:
        refreshRanges();
        break;
      }		  
      BackgroundFetch.finish(taskId);
    },
  );

  setupBackgroundJobs();
  BackgroundFetch.start();

  return (
    <View style={styles.container}>
      <Text>IPRange Watcher will notify you if your current IP is outside the IP range of your mobile carrier, which may indicate a man-in-the-middle attack</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function notifyProblem() {
	let localNotification = Notifications.postLocalNotification({
		body: "IP changed outside the range of your telecom or cannot be obtained. This may indicate your phone is connected to a malicous cell tower",
		title: "IP changed outside the typical range",
		silent: false,
		fireDate: new Date(),
	});
}

function setupBackgroundJobs() {
  BackgroundFetch.scheduleTask({
    taskId: COMPARE_IP_TASK,
    periodic: true,
    delay: 15 * 60 * 1000, // 15 minutes
    requiredNetworkType: BackgroundFetch.NETWORK_TYPE_CELLULAR
  });
  
  BackgroundFetch.scheduleTask({
    taskId: REFRESH_RANGES_TASK,
    periodic: true,
    delay: 24 * 60 * 60 * 1000 // 24 hours
  });
}

function compareIP() {
	// TODO force 1.1.1.1 and 8.8.8.8. DNS in order to avoid getting the DNS intercepted
  // alternatively, recommend setting 1.1.1.1
	var ip;

	try {
    const response = await fetch("https://api.ipify.com");
    ip = await response.text();
	} catch (ex) {
    console.error(ex);
    notifyProblem();
	}

	if (!ip) {
    notifyProblem();
	}

	var latestIp = DefaultPreference.get("latestIp");
	if (ip != latestIp) {
	  var ipRanges = DefaultPreference.get("ipRanges");
	  var insideConfiguredRanges = ipRanges.some((ipRange) => 
		new IPRangeMatcher(ipRange).matches(ip));
		
	  if (!insideConfiguredRanges) {
      notifyProblem();

      var sendForAnalysis = DefaultPreference.get("sendForAnalysis");
      if (sendForAnalysis) {
        // send IP, latestIp, telecomIdentifier and ipRanges for analysis
      }
	  }
	  DefaultPreference.set("latestIp", ip);
	}
}

function refreshRanges() {
  var telecomASN = DefaultPreference.get("telecomASN");
  try {
  const response = await fetch("https://ip.guide/" + telecomASN);
    ipRanges = response.json()['routes']['v4'];
    DefaultPreference.set("ipRanges", ipRanges);
  } catch (ex) {
    console.log(ex);
  }
}
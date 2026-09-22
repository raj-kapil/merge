import "react-native-gesture-handler";
import React, { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StoreProvider, useStore } from "./src/store";
import { DeviceFrame } from "./src/components/DeviceFrame";
import { BottomNav } from "./src/components/BottomNav";
import { Toast } from "./src/components/Toast";
import { Discover } from "./src/screens/Discover";
import { Saved } from "./src/screens/Saved";
import { Reader } from "./src/screens/Reader";
import { Sources } from "./src/screens/Sources";
import { Settings } from "./src/screens/Settings";
import { Article } from "./src/data/articles";
import { theme } from "./src/theme";

type Tab = "discover" | "saved" | "sources" | "settings";

const Shell: React.FC = () => {
  const { dark, toasts } = useStore();
  const t = theme(dark);
  const [tab, setTab] = useState<Tab>("discover");
  const [reading, setReading] = useState<Article | null>(null);

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        {reading ? (
          <Reader article={reading} onBack={() => setReading(null)} />
        ) : (
          <>
            <View style={{ flex: 1 }}>
              {tab === "discover" && <Discover onOpen={setReading} />}
              {tab === "saved" && <Saved onOpen={setReading} />}
              {tab === "sources" && <Sources />}
              {tab === "settings" && <Settings />}
            </View>
            <BottomNav tab={tab} onChange={setTab} />
          </>
        )}
        <Toast toasts={toasts} />
      </SafeAreaView>
    </View>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
        <DeviceFrame>
          <Shell />
        </DeviceFrame>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

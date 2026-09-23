import "react-native-gesture-handler";
import React, { useState } from "react";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StoreProvider, useStore } from "./src/store";
import { DeviceFrame } from "./src/components/DeviceFrame";
import { BottomNav } from "./src/components/BottomNav";
import { Discover } from "./src/screens/Discover";
import { Saved } from "./src/screens/Saved";
import { Reader } from "./src/screens/Reader";
import { Sources } from "./src/screens/Sources";
import { Settings } from "./src/screens/Settings";
import { Article } from "./src/data/articles";
import { theme } from "./src/theme";

type Tab = "discover" | "saved" | "sources" | "settings";

const Shell: React.FC = () => {
  const { dark } = useStore();
  const t = theme(dark);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("discover");
  const [reading, setReading] = useState<Article | null>(null);

  const topInset = Math.max(insets.top, Platform.OS === "web" ? 28 : 0);

  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: topInset }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      <View style={{ flex: 1 }}>
        {reading ? (
          <Reader
            article={reading}
            onBack={() => setReading(null)}
            onSelectArticle={setReading}
          />
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
      </View>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StoreProvider>
          <DeviceFrame>
            <Shell />
          </DeviceFrame>
        </StoreProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

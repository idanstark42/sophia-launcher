import { StyleSheet } from 'react-native'
import { View } from 'react-native'

import TouchPad from '@/components/TouchPad'

export default function HomeScreen() {
  return <View style={styles.container}>
    <TouchPad />
  </View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  }
})

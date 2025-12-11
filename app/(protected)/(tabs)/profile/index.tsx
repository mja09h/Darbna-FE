import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

const ProfileScreen = () => {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);

  // Pick profile picture MOHAMMED CHECK THIS LATER
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={
              image ? { uri: image } : require("../../../../../assets/icon.png") // Fallback image MOHAMMED CHECK THIS LATER
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>

        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.bio}>Mobile Developer | React Native</Text>

        <View style={styles.followContainer}>
          <TouchableOpacity style={styles.followItem}>
            <Text style={styles.followNumber}>120</Text>
            <Text style={styles.followLabel}>Following</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.followItem}>
            <Text style={styles.followNumber}>450</Text>
            <Text style={styles.followLabel}>Followers</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push("/(protected)/(tabs)/profile/settings/editProfile")
          }
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push("/(protected)/(tabs)/profile/settings/changePassword")
          }
        >
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf5ef",
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#2c120c",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#ad5410",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginTop: 10,
  },
  bio: {
    fontSize: 15,
    color: "#cbb7a4",
    marginTop: 4,
  },
  followContainer: {
    flexDirection: "row",
    marginTop: 20,
    gap: 40,
  },
  followItem: {
    alignItems: "center",
  },
  followNumber: {
    color: "#f5e6d3",
    fontWeight: "bold",
    fontSize: 18,
  },
  followLabel: {
    color: "#c1926b",
  },
  buttonsContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#ad5410",
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

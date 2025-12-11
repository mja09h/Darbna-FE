import AsyncStorage from "@react-native-async-storage/async-storage";

const getToken = async () => {
    return await AsyncStorage.getItem("token");
};

const setToken = async (token: string) => {
    return await AsyncStorage.setItem("token", token);
};

const removeToken = async () => {
    return await AsyncStorage.removeItem("token");
};

export {
    getToken,
    setToken,
    removeToken,
};

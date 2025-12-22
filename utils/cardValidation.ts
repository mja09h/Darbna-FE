export type CardType = "Visa" | "Mastercard" | "Amex" | "Discover" | "Unknown";

/**
 * Validates a credit card number using the Luhn algorithm
 */
export const validateCardNumber = (cardNumber: string): boolean => {
    // Remove spaces and non-digits
    const cleaned = cardNumber.replace(/\s+/g, "").replace(/\D/g, "");

    // Check if it's empty or too short
    if (!cleaned || cleaned.length < 13 || cleaned.length > 19) {
        return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    // Start from the rightmost digit
    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

/**
 * Detects the card type based on the card number
 */
export const getCardType = (cardNumber: string): CardType => {
    const cleaned = cardNumber.replace(/\s+/g, "").replace(/\D/g, "");

    if (!cleaned) return "Unknown";

    // Visa: starts with 4
    if (cleaned.startsWith("4")) {
        return "Visa";
    }

    // Mastercard: starts with 5 (51-55)
    if (cleaned.startsWith("5") && cleaned.length >= 2) {
        const secondDigit = parseInt(cleaned[1], 10);
        if (secondDigit >= 1 && secondDigit <= 5) {
            return "Mastercard";
        }
    }

    // Amex: starts with 34 or 37
    if (cleaned.startsWith("34") || cleaned.startsWith("37")) {
        return "Amex";
    }

    // Discover: starts with 6
    if (cleaned.startsWith("6")) {
        return "Discover";
    }

    return "Unknown";
};

/**
 * Formats card number with spaces every 4 digits
 */
export const formatCardNumber = (cardNumber: string): string => {
    // Remove all non-digits
    const cleaned = cardNumber.replace(/\D/g, "");

    // Add space every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;

    return formatted;
};

/**
 * Masks card number showing only last 4 digits
 */
export const maskCardNumber = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s+/g, "").replace(/\D/g, "");

    if (cleaned.length < 4) {
        return cardNumber;
    }

    const last4 = cleaned.slice(-4);
    const masked = "**** **** **** " + last4;

    return masked;
};

/**
 * Validates expiry date
 */
export const validateExpiryDate = (month: number, year: number): boolean => {
    if (!month || !year) return false;

    if (month < 1 || month > 12) return false;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Check if year is in the past
    if (year < currentYear) return false;

    // Check if month/year is in the past (same year, but month passed)
    if (year === currentYear && month < currentMonth) return false;

    // Check if year is too far in the future (e.g., more than 20 years)
    if (year > currentYear + 20) return false;

    return true;
};

/**
 * Validates CVV format
 */
export const validateCVV = (cvv: string, cardType: CardType = "Unknown"): boolean => {
    const cleaned = cvv.replace(/\D/g, "");

    // Amex has 4 digits, others have 3
    if (cardType === "Amex") {
        return cleaned.length === 4;
    }

    return cleaned.length === 3;
};

/**
 * Formats expiry date as MM/YY
 */
export const formatExpiryDate = (month: number, year: number): string => {
    if (!month || !year) return "";

    const monthStr = month.toString().padStart(2, "0");
    const yearStr = year.toString().slice(-2);

    return `${monthStr}/${yearStr}`;
};


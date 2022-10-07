export function typeformat(type: number) {
    switch (type) {
        case 0: {
            return "ADD";
        }
        case 1: {
            return "REMOVE";
        }
        case 2: {
            return "BUY";
        }
        default: {
            return "Loading";
        }
    }
}
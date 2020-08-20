/** UTILITIES FUNCTIONS STARTS HERE **/

let helperFunctions = {

    randomString() {
        var length = 20;
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    },

    generateInvoiceNumber() {
        var invNo = "P2/E/" + "" + Math.floor((Math.random() * 10000) + 1)
        return invNo;
    },

    //TO SENTENCE CASE
    toTitleCase(str) {
        if (str == "" || str == undefined) {
            return str
        } else {
            return str.replace(
                /\w\S*/g,
                function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            );
        }
    },

    //RETURN BOOLEAN VALUES
    getBoolean(value) {
        switch (value) {
            case true:
            case "true":
            case 1:
            case "1":
            case "on":
            case "yes":
                return true;
            default:
                return false;
        }
    },

    // thousand seperators
    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    //round to 2 decimal place
    roundToTwo(num) {
        return +(Math.round(num + "e+2") + "e-2");
    }

}

module.exports = helperFunctions;
function filterNullValues(req, res, next) {
    if (req.body && typeof req.body === "object") {
        Object.keys(req.body).forEach((key) => {
            const value = req.body[key];
            if (value === null || value === "null" || value === "") {
                delete req.body[key]; 
            }
        });
    }
    next(); 
}

module.exports = filterNullValues;

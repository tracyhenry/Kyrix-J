let getSqlPredicates = predArray => {
    let predicates = [];
    let traversePredDict = pd => {
        if ("==" in pd) {
            predicates.push({
                col: pd["=="][0].toString().replace(/&/g, "%26"),
                val: pd["=="][1].toString().replace(/&/g, "%26")
            });
            return;
        }
        if ("AND" in pd) {
            traversePredDict(pd["AND"][0]);
            traversePredDict(pd["AND"][1]);
        }
    };

    if (predArray.length > 0) traversePredDict(predArray[0]);
    return predicates;
};

let dedupFilters = filters => {
    let filtersDeduped = [];
    for (let f of filters) {
        let exist = false;
        for (let ff of filtersDeduped)
            if (ff.col === f.col && ff.val === f.val) {
                exist = true;
                break;
            }
        if (!exist) filtersDeduped.push(f);
    }
    return filtersDeduped;
};

export {getSqlPredicates, dedupFilters};

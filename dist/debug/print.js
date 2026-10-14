export const printDefault = (arg) => {
    let format = "";
    arg.array.forEach((e, i) => {
        const t = arg.array[i];
        format += `${t} `;
    });
    return { format, styles: [] };
};
//# sourceMappingURL=print.js.map
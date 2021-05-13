export default class LARSItemSheet extends ItemSheet {
  get template() {
    return `systems/lars/templates/sheets/${this.item.data.type}-sheet.html`;
  }

  getData() {
    const data = super.getData();
    data.config = CONFIG.brap;
    return data;
  }
}

export default class MyItemSheet extends ItemSheet {
  get template() {
    return `systems/lars/templates/sheets/${this.item.data.type}-sheet.html`;
  }

  getData() {
    const data = super.getData();
    data.config = CONFIG.lars;
    return data;
  }
}

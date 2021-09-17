export default class MyActorSheet extends ActorSheet {

  get template()
  {
    return `systems/lars/templates/sheets/${this.actor.data.type}-sheet.html`;
  }

  activateListeners(html) {
    html.find(".create-item").click(this.createItem.bind(this));
    html.find(".delete-item").click(this.deleteItem.bind(this));
    html.find(".edit-item").click(this.editItem.bind(this));

    // Aspects and Attributes
    html.find(".Aspect-Hyperlink").mousedown(this.onAspectMouseDown.bind(this));
    html.find(".increment-amount").mousedown(this.onItemAmountMouseDown.bind(this));

    html.find(".Attribute-Hyperlink").click(this.onAttributeClick.bind(this));

    html.find(".journalButton").click(this.onJournalButton.bind(this));
    html.find(".bioButton").click(this.onBioButton.bind(this));
    //html.find(".attributeValue").change(this.onAttributeChanged.bind(this));

    if (this.actor.isOwner) {
      const onDragStartHandler = ev => this._onDragStart(ev);
      const onDropHandler = ev => this._onDropHanler(ev);
      html.find('tr.draggableRow').each((i, li) => {
        li.addEventListener('dragstart', onDragStartHandler, false);
        li.addEventListener('drop', onDropHandler, false);
    })};

    // html.on('mousedown', '.attribute-hyperlink', (ev) => {});
    //this.lastBonus = {};
    this.row = undefined;
    this.lastOpposed = false;
    this.lastTarget = 10;
    super.activateListeners(html);
  }

  async onAttributeClick(event) {
    let attribute = event.currentTarget.dataset.attribute;
    let aspect = event.currentTarget.dataset.aspect;

    let controlBlock = {
      "dicesToRoll": "2d6",
      "aspect": aspect,
      "attribute": attribute,
      "lastOpposed": this.lastOpposed,
      "target": this.lastTarget
    };

    if(event.ctrlKey) {
      this._diceRoll(event, controlBlock);
    }
    else {
      const template = "systems/lars/templates/sheets/partials/roll-dialog.hbs";
      let html = await renderTemplate(template, controlBlock);

      let d = new Dialog({
        title: "" + attribute + " check",
          content: html,
          buttons: {
            disadvantage: {
              icon: '<i class="fas fa-arrow-down"></i>',
              label: "Bane",
              callback: html => {
                let form = html[0].querySelector("form");
                controlBlock.target = parseInt(form.target.value);
                this.lastTarget = controlBlock.target;
                controlBlock.opposed = form.opposed.checked;
                this.lastOpposed = controlBlock.opposed;
                controlBlock.dicesToRoll = "3d6dh";
                this._diceRoll(event, controlBlock);
              }
            },
            normal: {
              label: "Normal",
              callback: html => {
                let form = html[0].querySelector("form");
                controlBlock.target = parseInt(form.target.value);
                this.lastTarget = controlBlock.target;
                controlBlock.opposed = form.opposed.checked;
                this.lastOpposed = controlBlock.opposed;
                this._diceRoll(event, controlBlock);
              }
            },
            advantage: {
              icon: '<i class="fas fa-arrow-up"></i>',
              label: "Boon",
              callback: html => {
                let form = html[0].querySelector("form");
                controlBlock.target = parseInt(form.target.value);
                this.lastTarget = controlBlock.target;
                controlBlock.opposed = form.opposed.checked;
                this.lastOpposed = controlBlock.opposed;
                controlBlock.dicesToRoll = "3d6dl";
                this._diceRoll(event, controlBlock);
              }
            }
          },
          default: "normal"
        });
      d.render(true);
    }
  }

  onAspectMouseDown(event)
  {
    let aspectName = event.currentTarget.dataset.aspect;
    let aspect = this.actor.data.data.aspects[aspectName];

    aspect.current = Number(aspect.current);

    if (event.button == 0) {
      let maxAspect = 0;
      for(const attribute in aspect.attributes) {
        maxAspect += Number(aspect.attributes[attribute].value);
      }
      if(aspect.current < maxAspect)
        aspect.current += Number(1);
    }
    else if (event.button == 2) {
      if(aspect.current > 0) {
        aspect.current -= Number(1);
      }
    }
    let currentPath = "data.aspects." + aspectName + ".current";
    let data = {};

    data[currentPath] = aspect.current;
    this.actor.update(data);
  }

  onItemAmountMouseDown(event)
  {
    let itemId = event.currentTarget.dataset.id;
    let item = this.actor.items.get(itemId);
    let newAmount = item.data.data.amount;

    if (event.button == 0) {
      ++newAmount;
    }
    else if (event.button == 2) {
      if(newAmount > 0)
        --newAmount;
    }
    let data = {};
    data["data.amount"] = newAmount;
    item.update(data);
  }

  onBioButton()
  {
    console.log("Clicked BioButton");
  }

  async onJournalButton()
  {
    console.log("Clicked JournalButton");
  }

  async _diceRoll(event, controlBlock) {
    let actorData = this.actor.data;
    let attributeBonus = actorData.data.aspects[controlBlock.aspect]
        .attributes[controlBlock.attribute].value;

    let rollFormula = controlBlock.dicesToRoll;
    controlBlock["attributeBonus"] = attributeBonus;

    let rollResult = new Roll(rollFormula, controlBlock).roll();
    rollResult.dices = rollResult.terms[rollResult.terms.length - 1].results;
    rollResult.attributeBonus = attributeBonus;

    rollResult.opposed = controlBlock.opposed;
    rollResult.calculatedResult = rollResult._total + Number(attributeBonus);
    if(!controlBlock.opposed)
    {
      rollResult.calculatedResult -= controlBlock.target;
    }

    // CalculateCrit TODO: separate function?
    rollResult.crit = true;
    rollResult.fumble = true;
    for(let i = 0; i < rollResult.dices.length; i++) {
      if(rollResult.dices[i].active) {
        if(rollResult.dices[i].result != 6) {
          rollResult.crit = false;
        }
        if (rollResult.dices[i].result != 1) {
          rollResult.fumble = false;
        }
      }
    }

    let html = await renderTemplate("systems/lars/templates/chat/skill-test.hbs", rollResult);
    let messageData = {
      speaker: ChatMessage.getSpeaker(),
      content: html
    };
    rollResult.toMessage(messageData);
  }

  async createItem(event)
  {
    event.preventDefault();
    let target = event.currentTarget;
    let type = target.dataset.type;

    const actor = this.actor;
    const data = [{name: "unamed", type: type}];
    const created = await Item.createDocuments(data, {parent: actor});

    if(!event.ctrlKey)
      this.actor.items.get(created[0].id).sheet.render(true);
  }

  editItem(event)
  {
      event.preventDefault();
      let target = event.currentTarget;
      let itemId = target.closest(".edit-item").dataset.id; //.dataset.id
      let item = this.actor.items.get(itemId);
      item.sheet.render(true);
  }

  deleteItem(event)
  {
    event.preventDefault();
    let target = event.currentTarget;
    let itemId = target.closest(".delete-item").dataset.id; //.dataset.id;
    let itemType = target.closest(".delete-item").dataset.type; //.dataset.id;
    let item = this.actor.items.get(itemId);
    let _content = "<p>Confirm deletion of " + itemType + ": " + item.name + "</p>";

    if(event.ctrlKey)
    {
      item.delete();
    }
    else {
      let d = new Dialog({
        title: "Confirm Deleation",
          content: _content,
          buttons: {
            one: {
              icon: '<i class="fas fa-check"></i>',
              label: "delete",
              callback: () => item.delete()
            },
            two: {
              icon: '<i class="fas fa-times"></i>',
              label: "cancel",
              callback: () => console.log("canceled")
            }
          }
        });
        d.render(true);
    }
  }
/*
  _onDragStart(ev)
  {
    this.row = event.target;
  }

  _onDropHanler(ev)
  {
    let children = Array.from(this.row.parentNode.children);
    let index = children.indexOf(ev.target.parentNode);
    let dragged = children.indexOf(this.row);
    if ( index > dragged )
      children[index].after(this.row);
    else
      children[index].before(this.row);

    let draggedId = this.row.id;
    let targetId = ev.target.parentNode.id;

    console.log(draggedId);
    console.log(targetId)
    console.log(this.actor.data.items);
  }
*/
  getData() {
    let data = super.getData();
    data.config = CONFIG.lars;
    data.equipments = data.items.filter(function (item) { return item.type == "equipment" });
    data.apparel = data.items.filter(function (item) { return item.type == "apparel"});
    data.status = data.items.filter(function (item) { return item.type == "status"});
    data.professions = data.items.filter(function(item) { return item.type == "profession"});
    data.talents = data.items.filter(function(item) { return item.type == "talent"});
    data.misc =  data.items.filter(function(item) { return item.type == "misc"});
    data.aspects = data.data.data.aspects;
    return data;
  }
}

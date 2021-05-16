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
    html.find(".Attribute-Hyperlink").click(this.onAttributeClick.bind(this));
    html.find(".attributeValue").change(this.onAttributeChanged.bind(this));
    // html.on('mousedown', '.attribute-hyperlink', (ev) => {});

    super.activateListeners(html);
  }

  async onAttributeClick(event) {
    let attribute = event.currentTarget.dataset.attribute;
    let aspect = event.currentTarget.dataset.aspect;
    let controlBlock = {
      "dicesToRoll": "2d6",
      "aspect": aspect,
      "attribute": attribute,
      "bonus": 0,
      "target": 10
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
              icon: '<i class="fas fa-check"></i>',
              label: "Disadvantage",
              callback: html => {
                let form = html[0].querySelector("form");
                controlBlock.target = parseInt(form.target.value);
                controlBlock.bonus = parseInt(form.bonus.value);
                controlBlock.dicesToRoll = "3d6dh";
                this._diceRoll(event, controlBlock);
              }
            },
            normal: {
              icon: '<i class="fas fa-times"></i>',
              label: "Normal",
              callback: html => {
                let form = html[0].querySelector("form");
                controlBlock.target = parseInt(form.target.value);
                controlBlock.bonus = parseInt(form.bonus.value);
                this._diceRoll(event, controlBlock);
              }
            },
            advantage: {
              icon: '<i class="fas fa-times"></i>',
              label: "Advantage",
              callback: html => {
                let form = html[0].querySelector("form");
                controlBlock.target = parseInt(form.target.value);
                controlBlock.bonus = parseInt(form.bonus.value);
                controlBlock.dicesToRoll = "3d6dl";
                this._diceRoll(event, controlBlock);
              }
            }
          }
        });
      d.render(true);
    }
  }

  onAttributeChanged(event) {
    let aspect = event.currentTarget.dataset.aspect; //.parentElement.dataset.aspect;
    let newTotal = 0;
    for (const prop in this.actor.data.data.aspects[aspect].attributes) {

      newTotal += Number(this.actor.data.data.aspects[aspect].attributes[prop].value);
      console.log(aspect + " " + newTotal);
    }

    let path = "data.aspects." + aspect + ".total";
    let data = {};
    data[path] = newTotal;
    this.actor.update(data);
  }

  onAspectMouseDown(event)
  {
    let aspectName = event.currentTarget.dataset.aspect;
    let aspect = this.actor.data.data.aspects[aspectName];
    aspect.current = Number(aspect.current);

    if (event.button == 0) {
      if(aspect.current < aspect.total) {
        aspect.current += Number(1);
      }
    }
    else if (event.button == 2) {
      if(aspect.current > 0) {
        aspect.current -= Number(1);
      }
    }
    let path = "data.aspects." + aspectName + ".current";
    let data = {};
    data[path] = aspect.current;
    this.actor.update(data);
  }


  async _diceRoll(event, controlBlock) {
    let actorData = this.actor.data;
    let attributeBonus = actorData.data.aspects[controlBlock.aspect]
        .attributes[controlBlock.attribute].value;

    let rollFormula = controlBlock.dicesToRoll;
    controlBlock["attributeBonus"] = attributeBonus;

    let rollResult = new Roll(rollFormula, controlBlock).roll();
    rollResult.dices = rollResult.terms[rollResult.terms.length - 1].results;
    rollResult.calculatedResult =
      rollResult._total + Number(attributeBonus) + controlBlock.bonus - controlBlock.target;

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

  createItem(event)
  {
    event.preventDefault();
    let target = event.currentTarget;
    let newItem =
    {
      name:"Unnamed",
      type: target.dataset.type
    };
    return this.actor.createOwnedItem(newItem);
  }

  editItem(event)
  {
      event.preventDefault();
      let target = event.currentTarget;
      let itemId = target.closest(".edit-item").dataset.id; //.dataset.id;
      let item = this.actor.getOwnedItem(itemId);
      item.sheet.render(true);
  }

  deleteItem(event)
  {
    event.preventDefault();
    let target = event.currentTarget;
    let itemId = target.closest(".delete-item").dataset.id; //.dataset.id;
    let itemType = target.closest(".delete-item").dataset.type; //.dataset.id;
    let item = this.actor.getOwnedItem(itemId);
    let _content = "<p>Confirm deletion of " + itemType + ": " + item.name + "</p>";

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

  getData() {
    let data = super.getData();
    data.config = CONFIG.lars;
    data.equipments = data.items.filter(function (item) { return item.type == "equipment" });
    data.apparel = data.items.filter(function (item) { return item.type == "apparel"});
    data.status = data.items.filter(function (item) { return item.type == "status"});
    data.professions = data.items.filter(function(item) { return item.type == "profession"});
    data.talents = data.items.filter(function(item) { return item.type == "talent"});
    data.misc =  data.items.filter(function(item) { return item.type == "misc"});

    data.aspects = data.data.aspects;

    return data;
  }
}

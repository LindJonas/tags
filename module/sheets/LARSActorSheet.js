export default class MyActorSheet extends ActorSheet {

  get template()
  {
    return `systems/lars/templates/sheets/${this.actor.data.type}-sheet.html`;
  }

  activateListeners(html) {
    html.find(".del-item-button").click(this.deleteItem.bind(this));
    html.find(".create-item").click(this.createItem.bind(this));
    html.find(".del-item").click(this.deleteItem.bind(this));
    html.find(".edit-item").click(this.editItem.bind(this));

    if(this.actor.owner) {
      html.find(".onCheck").click(this._onCheck.bind(this));
    }

/*
    html.on('mousedown', '.attribute-hyperlink', (ev) => {

      var attributeName = ev.currentTarget.dataset.attribute;
      var attribute = this.actor.data.data[attributeName];

      if (ev.button == 0) {
        if(attribute.value < attribute.max) {
          attribute.value += 1;
        }
      }
      else if (ev.button == 2) {
        if(attribute.value > 0) {
          attribute.value -= 1;
        }
      }

      var path = "data." + attributeName + ".value";
      let data = {};
      data[path] = attribute.value;
      this.actor.update(data);
    });
*/
    super.activateListeners(html);
  }


  async _onCheck(event) {
    /*
    let actorData = this.actor.data;

    var skill = {};
    skill.name = event.currentTarget.dataset.skill;
    skill.value = actorData.data[skill.name].value;

    var attribute = {};
    attribute.name = actorData.data[skill.name].governingAttribute;
    attribute.value = actorData.data[attribute.name].value;

    var target = Number(skill.value) + Number(attribute.value) + this.equipmentBonus;
    var description = "" + attribute.name + "(" + attribute.value +
        ") + " + skill.name + "(" + skill.value + ")";

    var dicesToRoll = 3;
    var diceType = "d10";

    if(!event.ctrlKey)
    {
      console.log("non standard roll");
    }

    if(this.equipmentBonus > 0){
      description += " + equipment(" + this.equipmentBonus + ")";
    }

    var rollFormula = "" + dicesToRoll + diceType;
    var rollData = {
          skillName: skill.name,
          description: description,
          target: target
    };

    let rollResult = new Roll(rollFormula, rollData).roll();
    rollResult.dices = rollResult.terms[rollResult.terms.length - 1].results;

    // Calculate Crit and Fumble.
    var countMin = 0;
    var countMax = 0;
    rollResult.dices.forEach((item) => {
      if(item.result == 1)
        ++countMin;
      else if(item.result == 10)
        ++countMax;
    });
    rollResult.crit = (countMin > 1);
    rollResult.fumble = (countMax > 1);

    rollResult.calculatedResult =
        skill.value + attribute.value + this.equipmentBonus - rollResult.results[0];

    let html = await renderTemplate("systems/basicroleandplay/templates/chat/skill-test.hbs", rollResult);
    let messageData = {
      speaker: ChatMessage.getSpeaker(),
      content: html
    };

    rollResult.toMessage(messageData);
    */
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
      console.log(itemId);
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
      title: "Test Dialog",
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
    data.profession = data.items.filter(function(item) { return item.type == "profession"});
    data.talents = data.items.filter(function(item) { return item.type == "talent"});
    data.misc =  data.items.filter(function(item) { return item.type == "misc"});

    data.aspects = data.data.aspects;

    return data;
  }
}

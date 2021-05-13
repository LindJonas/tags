import {lars} from "./module/config.js"
import MyItemSheet from "./module/sheets/LARSItemSheet.js";
import MyActorSheet from "./module/sheets/LARSActorSheet.js";

async function preloadHandlebarsTemplates() {
  const templatePaths = [
    "systems/lars/templates/sheets/partials/character-attributes.hbs",
    "systems/lars/templates/sheets/partials/character-skills.hbs",
    "systems/lars/templates/sheets/partials/equipment-cards.hbs",
    "systems/lars/templates/sheets/partials/advancedskills-cards.hbs",
    "systems/lars/templates/sheets/partials/apparel-cards.hbs",
    "systems/lars/templates/sheets/partials/status-cards.hbs",
    "systems/lars/templates/sheets/partials/talent-cards.hbs",
    "systems/lars/templates/chat/skill-test.hbs",
    "templates/dice/roll.html"
  ];
  return loadTemplates(templatePaths);
}

Hooks.once("init", function()
{
  CONFIG.brap = brap;

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("lars", MyItemSheet, { makeDefault: true });

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("lars", MyActorSheet, { makeDefault: true });

  preloadHandlebarsTemplates();
});

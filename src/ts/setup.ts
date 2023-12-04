import manifest from '../../manifest.json';
export function setup(ctx: Modding.ModContext) {
  const ARM_SETTINGS = ctx.settings.section('Ancient Relics');
  ARM_SETTINGS.add([
    {
      type: 'switch',
      name: 'enable-mod',
      label: 'Enable Ancient Relics',
      hint: ' ',
      default: true,
      onChange: () => {
        const btn = document
          .getElementById(`ancientRelicsMod:enable-mod`)
          ?.nextElementSibling?.querySelector('small');

        if (btn) {
          btn.textContent = 'Reload Required';
          btn.classList.add('text-warning');
          updateButton();
        }
      },
    } as unknown as Modding.Settings.SwitchConfig,
    {
      type: 'switch',
      name: 'enable-lesser-relics',
      label: 'Enable Lesser Relics',
      hint: ' ',
      default: true,
      onChange: () => {
        const btn = document
          .getElementById(`ancientRelicsMod:enable-lesser-relics`)
          ?.nextElementSibling?.querySelector('small');

        if (btn) {
          btn.textContent = 'Reload Required';
          btn.classList.add('text-warning');
          updateButton();
        }
      },
    } as unknown as Modding.Settings.SwitchConfig,
    {
      type: 'button',
      name: 'save-reload',
      display: 'Save & Reload',
      color: 'primary',
      onClick: () => {
        saveData();
        window.location.reload();
      },
    } as unknown as Modding.Settings.ButtonConfig,
  ]);

  ctx.patch(Skill as any, 'hasMasterRelic').replace(function () {
    this.game.currentGamemode.allowAncientRelicDrops =
      ARM_SETTINGS.get('enable-mod');
    if (!this.game.currentGamemode.allowAncientRelicDrops) return false;
    return this.numberOfRelicsFound >= 5;
  });

  function updateButton() {
    const btn = document.getElementById('ancientRelicsMod:save-reload');
    if (btn && btn.classList.contains('btn-primary')) {
      btn.classList.replace('btn-primary', 'btn-danger');
    } else return;
  }

  /**
   * Patch ARM settings in sidebar to inform user if mod is disabled and current gamemode is already Ancient Relics
   */
  ctx.patch(SidebarSubitem, 'configure').before(function (config) {
    if (
      this.id !== 'Ancient Relics Mod' ||
      game.currentGamemode.localID !== 'AncientRelics'
    )
      return [config];

    // overwrite default onClick function that opens settings modal
    if (config)
      config.onClick = () =>
        Swal.fire({
          icon: 'error',
          title: 'Mod Disabled',
          html: `<h5 class="font-w600 font-size-sm mb-1 text-danger">Ancient Relics Mod is disabled for this save</h5><h5 class="font-w600 font-size-sm m-0 text-warning"><small>(Current gamemode is already Ancient Relics)</small></h5>`,
        });

    return [config];
  });

  ctx.onCharacterLoaded(() => {
    if (game.currentGamemode.localID === 'AncientRelics') return;

    const lesserRelicsEnabled = ARM_SETTINGS.get('enable-lesser-relics');
    console.log(
      'Ancient Relics Mod v%s loaded save %c%s%c with: \n%cAncient Relics %s%c\n%cLesser Relics %s%c',
      manifest.version,
      'color: green; font-weight: bold;',
      game.characterName,
      '',
      'color: #d3ba7c;',
      ARM_SETTINGS.get('enable-mod') ? 'Enabled' : 'Disabled',
      '',
      'color: #e41e7f;',
      lesserRelicsEnabled ? 'Enabled' : 'Disabled',
      '',
    );

    // ensure no relics are added if mod is disabled
    ctx.patch(Player, 'addAncientRelicModifiers').replace(function (o) {
      if (!ARM_SETTINGS.get('enable-mod')) return;
      else return o();
    });

    // add the current gamemode to the list of gamemodes that the lesser relic can drop in
    if (lesserRelicsEnabled)
      game.skills
        .filter((skill) =>
          skill.rareDrops.some(
            (drop) => drop.item?._localID.includes('Lesser_Relic'),
          ),
        )
        .forEach((skill) => {
          const lesserRelicDrop = skill.rareDrops.find(
            (drop) => drop.item?._localID.includes('Lesser_Relic'),
          );
          if (lesserRelicDrop && lesserRelicDrop.gamemodes)
            lesserRelicDrop.gamemodes.push(game.currentGamemode);
        });
  });

  ctx.onInterfaceReady(() => {
    if (game.currentGamemode.localID === 'AncientRelics') return;

    // Show ancient relics sidebar item
    const category = sidebar.category('Ancient Relics');
    if (category && category.rootEl && ARM_SETTINGS.get('enable-mod'))
      category.rootEl.classList.remove('d-none');
  });
}

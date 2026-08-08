## Skill Icons

### Overview

This action allows you to _**add clean, responsive, and theme-aware tech stack icons to your GitHub profile README**_. The icons automatically adapt to the viewer's GitHub theme (light or dark mode), ensuring your profile always looks professional.

### Icons

> <sup>**All of [simpleicons](https://simpleicons.org) catalog in your hands**</sup>

<!-- SKILL_ICONS_START icons="javascript,python,typescript,openjdk,dotnet,cplusplus,c,php,swift,kotlin,ruby,go,rust,scala,r,html5,css,sass,tailwindcss,react,angular,vuedotjs,svelte,nextdotjs,nuxt,nodedotjs,express,django,flask,spring,laravel,rubyonrails,postgresql,mysql,mongodb,redis,sqlite,docker,kubernetes,git,github,gitlab,linux,ubuntu,debian,archlinux,vscodium,intellijidea,neovim,vim,webpack,vite,babel,eslint,prettier,npm,yarn,pnpm,bun,deno" -->

![][SKILL_ICONS_0]

<!-- SKILL_ICONS_END -->

## Usage

### Installation

Copy and paste the following snippet into your .yml file.

```yaml
- name: Skill Icons
  uses: emrocode/skill-icons@v1
  # Advanced configuration
  # You can customize the layout by adding specific options to the template configuration
  with:
    icon_size: # Default: 48
    per_row: # Default: 15
    out_path: # Default: assets/svgs
    tag: # Default: SKILL_ICONS
    filename: # Default: README.md
    commit_message: # Default: chore(si): update assets and docs
```

### Permissions

```yaml
permissions:
  contents: write
```

### README

Copy and paste the markdown snippet below into your `README.md` file. _**Replace the technology names with your preferred stack**_.

> [!IMPORTANT]
> **<sup>All technology names must match official [simpleicons](https://simpleicons.org/) slugs</sup>**

```md
### 🛠️ Tech Stack

<!-- SKILL_ICONS_START -->

css,javascript,typescript,react,nextdotjs,tailwindcss

<!-- SKILL_ICONS_END -->
```

[SKILL_ICONS_0]: assets/svgs/javascript..deno-f11be47.svg

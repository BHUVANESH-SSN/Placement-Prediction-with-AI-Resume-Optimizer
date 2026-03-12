"""
resource_mapper.py — Maps skills to curated learning resources.
"""

RESOURCE_MAP = {
    # INTERNET / WEB BASICS
    "internet": "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work",
    "http": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    "dns": "https://www.cloudflare.com/learning/dns/what-is-dns/",
    "hosting": "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_do_you_host_your_website",
    "browsers": "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_do_browsers_work",

    # FRONTEND CORE
    "html": "https://developer.mozilla.org/en-US/docs/Web/HTML",
    "css": "https://developer.mozilla.org/en-US/docs/Web/CSS",
    "javascript": "https://javascript.info/",
    "typescript": "https://www.typescriptlang.org/docs/",
    "dom": "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model",
    "web performance": "https://developer.mozilla.org/en-US/docs/Learn/Performance",
    "accessibility": "https://developer.mozilla.org/en-US/docs/Learn/Accessibility",
    "a11y": "https://developer.mozilla.org/en-US/docs/Learn/Accessibility",
    "responsive design": "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design",

    # FRONTEND FRAMEWORKS & LIBS
    "react": "https://react.dev/learn",
    "next.js": "https://nextjs.org/learn",
    "vue": "https://vuejs.org/guide/introduction.html",
    "angular": "https://angular.io/docs",
    "svelte": "https://svelte.dev/docs",
    "tailwind": "https://tailwindcss.com/docs",
    "bootstrap": "https://getbootstrap.com/docs/",
    "sass": "https://sass-lang.com/documentation/",
    "redux": "https://redux.js.org/introduction/getting-started",
    "zustand": "https://docs.pmnd.rs/zustand/getting-started/introduction",
    "tanstack query": "https://tanstack.com/query/latest/docs/framework/react/overview",
    "react query": "https://tanstack.com/query/latest/docs/framework/react/overview",
    "webpack": "https://webpack.js.org/concepts/",
    "vite": "https://vitejs.dev/guide/",
    "three.js": "https://threejs.org/docs/",

    # BACKEND & LANGUAGES
    "python": "https://docs.python.org/3/tutorial/",
    "fastapi": "https://fastapi.tiangolo.com/tutorial/",
    "django": "https://docs.djangoproject.com/en/stable/",
    "flask": "https://flask.palletsprojects.com/",
    "node.js": "https://nodejs.org/en/docs/guides/",
    "express": "https://expressjs.com/en/guide/routing.html",
    "java": "https://dev.java/learn/",
    "spring": "https://spring.io/guides",
    "go": "https://go.dev/learn/",
    "golang": "https://go.dev/learn/",
    "rust": "https://www.rust-lang.org/learn",
    "php": "https://www.php.net/manual/en/getting-started.php",
    "laravel": "https://laravel.com/docs",
    "c++": "https://learncpp.com",
    "c#": "https://learn.microsoft.com/en-us/dotnet/csharp/",
    ".net": "https://learn.microsoft.com/en-us/dotnet/",

    # DATABASE
    "sql": "https://www.w3schools.com/sql/",
    "postgresql": "https://www.postgresql.org/docs/",
    "mysql": "https://dev.mysql.com/doc/",
    "mongodb": "https://www.mongodb.com/docs/manual/",
    "redis": "https://redis.io/docs/",
    "sqlite": "https://www.sqlite.org/docs.html",
    "prisma": "https://www.prisma.io/docs",
    "mongoose": "https://mongoosejs.com/docs/",

    # DEVOPS & CLOUD
    "docker": "https://docs.docker.com/get-started/",
    "kubernetes": "https://kubernetes.io/docs/home/",
    "k8s": "https://kubernetes.io/docs/home/",
    "git": "https://git-scm.com/doc",
    "github": "https://docs.github.com/",
    "gitlab": "https://docs.gitlab.com/",
    "ci/cd": "https://www.redhat.com/en/topics/devops/what-is-ci-cd",
    "jenkins": "https://www.jenkins.io/doc/",
    "github actions": "https://docs.github.com/en/actions",
    "terraform": "https://www.terraform.io/docs",
    "ansible": "https://docs.ansible.com/",
    "aws": "https://docs.aws.amazon.com",
    "azure": "https://learn.microsoft.com/en-us/azure/",
    "gcp": "https://cloud.google.com/docs/",
    "linux": "https://linuxjourney.com",
    "bash": "https://www.gnu.org/software/bash/manual/bash.html",

    # DATA SCIENCE / ML / ANALYST
    "pandas": "https://pandas.pydata.org/docs/",
    "numpy": "https://numpy.org/doc/",
    "scikit-learn": "https://scikit-learn.org/stable/user_guide.html",
    "machine-learning": "https://www.coursera.org/learn/machine-learning",
    "deep-learning": "https://www.deeplearning.ai/",
    "tensorflow": "https://www.tensorflow.org/learn",
    "pytorch": "https://pytorch.org/get-started/locally/",
    "matplotlib": "https://matplotlib.org/stable/contents.html",
    "seaborn": "https://seaborn.pydata.org/",
    "tableau": "https://help.tableau.com/current/pro/desktop/en-us/gettingstarted_tutorial.htm",
    "power bi": "https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview",
    "excel": "https://support.microsoft.com/en-us/excel",

    # CYBER SECURITY
    "owasp": "https://owasp.org/www-project-top-ten/",
    "networking": "https://www.cloudflare.com/learning/network-layer/what-is-the-network-layer/",
    "cryptography": "https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API",
    "ethical hacking": "https://www.eccouncil.org/programs/certified-ethical-hacker-ceh/",
    "penetration testing": "https://www.offsec.com/courses/pen-200/",
    "firewalls": "https://www.checkpoint.com/cyber-hub/network-security/what-is-firewall/",
    
    # PRODUCT & UI/UX
    "ux design": "https://www.nngroup.com/articles/definition-user-experience/",
    "wireframing": "https://framer.com/academy/lessons/wireframing",
    "figma": "https://help.figma.com/hc/en-us",
    "usability testing": "https://www.interaction-design.org/literature/topics/usability-testing",
    "product management": "https://www.productplan.com/glossary/product-management/",
    "agile": "https://www.atlassian.com/agile",
    "scrum": "https://www.scrum.org/resources/what-is-scrum",
}

def get_resource_link(skill: str) -> str:
    """Return a curated resource link for a skill, prioritizing roadmap.sh guides."""
    skill_raw = skill.lower().strip()
    skill_slug = skill_raw.replace(" ", "-")
    
    # Priority 1: Direct match in our curated map
    if skill_slug in RESOURCE_MAP:
        return RESOURCE_MAP[skill_slug]
    if skill_raw in RESOURCE_MAP:
        return RESOURCE_MAP[skill_raw]
        
    # Priority 2: roadmap.sh specific guides
    common_guides = [
        "http", "dns", "ssl", "security", "api", "rest", "graphql", "jwt", "oauth",
        "docker", "kubernetes", "git", "linux", "bash", "ssh", "cloud", "deployment",
        "performance", "pwa", "spa", "testing", "clean-code", "solid", "dry"
    ]
    if any(g == skill_slug for g in common_guides):
        return f"https://roadmap.sh/guides/{skill_slug}"

    # Priority 3: Partial match in our curated map
    for key, link in RESOURCE_MAP.items():
        if key in skill_raw:
            return link
            
    # Priority 4: Specialized Developer Search
    web_keywords = ["api", "web", "browser", "css", "html", "js", "auth", "security", "design", "ui", "ux", "dom"]
    if any(k in skill_raw for k in web_keywords):
        return f"https://developer.mozilla.org/en-US/search?q={skill.replace(' ', '+')}"
        
    # Priority 5: roadmap.sh search (Instead of general Google search)
    return f"https://roadmap.sh/search?q={skill.replace(' ', '+')}"


// List of standard skills for fuzzy matching target
// This is the "Source of Truth" for correct skill spelling
export const standardSkills = [
    // --- Frontend ---
    "react", "angular", "vue", "svelte", "ember", "next.js", "nuxt.js", "gatsby", "remix",
    "solidjs", "alpinejs", "preact", "lit", "stencil", "backbone", "knockout",
    "html", "css", "sass", "less", "stylus", "tailwind css", "bootstrap", "material ui",
    "chakra ui", "styled-components", "javascript", "typescript", "coffeescript",
    "jquery", "ajax", "json", "xml", "graphql", "apollo", "trpc", "websocket", "webrtc",
    "webpack", "vite", "rollup", "parcel", "esbuild", "babel", "pnpm", "yarn", "npm",

    // --- Backend ---
    "node.js", "deno", "bun", "python", "django", "flask", "fastapi", "ruby", "ruby on rails", "sinatra",
    "java", "spring boot", "jakarta ee", "hibernate", "kotlin", "ktor",
    "c#", ".net", "asp.net core", "entity framework", "blazor",
    "php", "laravel", "symfony", "codeigniter", "wordpress", "drupal",
    "go", "golang", "gin", "echo", "fiber",
    "rust", "actix", "rocket", "tokyo",
    "elixir", "phoenix", "scala", "play framework", "akka", "clojure",
    "perl", "lua", "haskell", "erlang",

    // --- Database ---
    "postgresql", "mysql", "mariadb", "sqlite", "oracle database", "microsoft sql server",
    "mongodb", "couchdb", "cassandra", "scylladb", "hbase", "dynamodb", "cosmos db",
    "redis", "memcached", "elasticsearch", "solr", "neo4j", "arangodb", "cockroachdb", "tidb",
    "firebase", "supabase", "convex", "pocketbase", "realm",

    // --- Cloud & DevOps ---
    "aws", "amazon web services", "azure", "google cloud platform", "gcp", "digitalocean", "heroku", "vercel", "netlify",
    "docker", "kubernetes", "podman", "openshift", "rancher", "helm",
    "jenkins", "gitlab ci", "github actions", "circleci", "travis ci", "bamboo", "teamcity",
    "terraform", "ansible", "chef", "puppet", "saltstack", "cloudformation", "pulumi",
    "prometheus", "grafana", "elk stack", "splunk", "datadog", "new relic", "sentry",
    "nginx", "apache", "caddy", "traefik", "envoy", "istio", "cloudflare",
    "linux", "bash", "shell scripting", "powershell",

    // --- Mobile ---
    "ios", "swift", "objective-c", "cocoa touch", "xcode",
    "android", "kotlin", "java", "gradle", "jetpack compose",
    "react native", "flutter", "dart", "ionic", "capacitor", "cordova", "expo", "xamarin", ".net maui",

    // --- Testing ---
    "jest", "mocha", "chai", "jasmine", "karma",
    "cypress", "playwright", "puppeteer", "selenium", "webdriverio",
    "junit", "testng", "mockito", "pytest", "unittest", "rspec", "cucumber",

    // --- AI/ML & Data ---
    "python", "r", "julia", "matlab",
    "tensorflow", "pytorch", "keras", "scikit-learn", "xgboost", "lightgbm", "catboost",
    "pandas", "numpy", "scipy", "matplotlib", "seaborn", "plotly",
    "opencv", "nltk", "spacy", "hugging face", "transformers", "langchain", "llama index",
    "openai api", "anthropic api", "vertex ai", "sagemaker", "bedrock",
    "hadoop", "spark", "kafka", "flink", "airflow", "dbt", "snowflake", "databricks", "bigquery", "redshift",

    // --- Tools & Methodology ---
    "git", "github", "gitlab", "bitbucket", "mercurial", "svn",
    "jira", "confluence", "trello", "asana", "notion", "linear",
    "agile", "scrum", "kanban", "waterfall", "safe",
    "figma", "sketch", "adobe xd", "photoshop", "illustrator",
    "postman", "insomnia", "swagger", "openapi"
];

// Mapping for specific overrides/aliases to standard form
export const canonicalMap: Record<string, string> = {
    // Frontend
    "reactjs": "react",
    "react.js": "react",
    "vuejs": "vue",
    "vue.js": "vue",
    "angularjs": "angular",
    "angular.js": "angular",
    "html5": "html",
    "css3": "css",
    "js": "javascript",
    "es6": "javascript",
    "ts": "typescript",
    "jscript": "javascript",

    // Backend
    "nodejs": "node.js",
    "node": "node.js",
    "expressjs": "express",
    "express.js": "express",
    "django rf": "django",
    "drf": "django",
    "springboot": "spring boot",
    "spring": "spring boot",
    "dotnet": ".net",
    "csharp": "c#",

    // Database
    "postgres": "postgresql",
    "mongo": "mongodb",
    "ms sql": "microsoft sql server",
    "mssql": "microsoft sql server",
    "elastic": "elasticsearch",

    // Cloud / DevOps
    "cloud_platforms": "aws", // Defaulting generic catch-all to aws if needed, or remove
    // Actually, let's map specific clouds to their full names if needed, but standardSkills handles most.
    "k8s": "kubernetes",
    "gh actions": "github actions",

    // Tools
    "version_control": "git", // Generic term often implies git

    // AI/ML
    "llm": "large_language_models", // Not in standard list, maybe add?
    "genai": "generative_ai"
};

export const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "if", "then", "else", "when",
    "at", "by", "for", "from", "in", "into", "of", "off", "on", "onto",
    "to", "with", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "shall",
    "should", "can", "could", "may", "might", "must", "experience",
    "skills", "work", "job", "description", "requirements", "qualifications",
    "responsibilities", "knowledge", "proficiency", "ability", "strong",
    "excellent", "good", "preferred", "plus", "bonus"
]);

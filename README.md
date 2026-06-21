## Setup After Cloning

```bash
git clone <https://github.com/Project-end-Year/Tour-project.git>
cd Tour-project

composer install
npm install

cp .env.example .env
php artisan key:generate
php artisan migrate

npm run build
php artisan test

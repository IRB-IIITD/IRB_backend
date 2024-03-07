echo "killing pm2 task"
pm2 kill

echo "running task app.js"
pm2 start app.js

echo "restarting nginx..."
sudo service nginx restart

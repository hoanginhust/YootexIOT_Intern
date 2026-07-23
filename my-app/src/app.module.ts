import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // connect to MongoDB database
    MongooseModule.forRoot('mongodb://hoanginhust_db_user:pY9RNNkdDU82sWmi@ac-zgwmqqn-shard-00-00.28wta3w.mongodb.net:27017,ac-zgwmqqn-shard-00-01.28wta3w.mongodb.net:27017,ac-zgwmqqn-shard-00-02.28wta3w.mongodb.net:27017/?ssl=true&replicaSet=atlas-guzkd5-shard-0&authSource=admin&appName=myDatabase'),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
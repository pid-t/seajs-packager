# seajs-packager

> A spm2 plugin for building the seajs business modules

-----

## Get start

该spm2插件采用自定义的方式来打包业务模块。
其模块组织方式类似与java的包管理，每个模块为单独一个目录，每个目录下面可以有一个`package.json`文件，定义该目录下需要暴露出的模块有哪些，并可以定义其下级子模块(使用`modules`配置)。比如有如下目录结构：

    -- js\
        -- app\
            -- userCenter\
                -- base \
                -- blogs \
                -- users \
                auth.js
                package.json

`package.json` 如下:

    {   
        "spm" : {
            "modules": [ "base", "blogs", "users" ],
            "output": {
                "relative": [ "auth.js" ]
            }
        }
    }

上面的配置表明在目录下有`base blogs users` 3个子模块(每个模块下面可以在使用package.json进行配置), 并且该目录有auth.js需要编译，采用`relative`方式进行。

## Install

确保已经安装了最新版本的Node.js

    $ npm install spm -g
    $ npm install seajs-packager -g

## Usage

    $ seajs-packager [dir] [options]

Options

* **-C**        Sea.js的配置文件，默认为`./seajs-config.js`
* **-O**        build输出目录, 默认为`sea-modules`
* **-D**        指定默认Sea.js的配置文件路径(.json), 比如一些alias， preload选项


### 0.0.1
* 初步实现功能